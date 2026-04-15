import { NotificationDispatchStatus, type Prisma, type Role } from "@prisma/client";
import { publishNotificationRealtimeEvent } from "@/lib/realtime-notifications";
import { prisma } from "@/lib/prisma";

type NotificationInput = {
  destinataireId: string;
  type: string;
  titre: string;
  message: string;
  lien?: string;
};

export const notificationEventDefinitions = [
  {
    type: "STAGIAIRE_CREATED",
    label: "Nouveau stagiaire",
    description: "Alerte lors de la creation d une nouvelle fiche stagiaire.",
  },
  {
    type: "RAPPORT_SUBMITTED",
    label: "Rapport soumis",
    description: "Alerte quand un rapport entre en revue.",
  },
  {
    type: "RAPPORT_RETURNED",
    label: "Rapport retourne",
    description: "Alerte quand un rapport est renvoye avec demande de corrections.",
  },
  {
    type: "STAGE_ENDING_SOON",
    label: "Fin de stage proche",
    description: "Alerte sur les stages qui approchent de leur date de fin.",
  },
  {
    type: "GITHUB_SYNC_SUCCESS",
    label: "Synchro GitHub terminee",
    description: "Alerte sur une synchronisation GitHub terminee avec succes.",
  },
  {
    type: "GITHUB_SYNC_FAILED",
    label: "Synchro GitHub echouee",
    description: "Alerte sur une synchronisation GitHub en erreur ou limitee.",
  },
  {
    type: "EVALUATION_SCHEDULED",
    label: "Evaluation planifiee",
    description: "Alerte quand une evaluation doit etre preparee ou tenir sa date.",
  },
  {
    type: "DOCUMENT_REJECTED",
    label: "Document rejete",
    description: "Alerte quand un document est refuse et demande une nouvelle action.",
  },
] as const;

export type NotificationEventType = (typeof notificationEventDefinitions)[number]["type"];

const HEAVY_NOTIFICATION_RECIPIENT_THRESHOLD = 2;
const NOTIFICATION_DISPATCH_MAX_ATTEMPTS = 3;

type DispatchJobInput = {
  eventType: string;
  title: string;
  message: string;
  link?: string;
  recipientIds: string[];
  triggeredByUserId?: string;
  payload?: Prisma.InputJsonValue;
};

async function getPreference(userId: string, eventType: string) {
  return prisma.notificationPreference.findUnique({
    where: {
      userId_eventType: {
        userId,
        eventType,
      },
    },
  });
}

async function shouldCreateInAppNotification(userId: string, eventType: string) {
  const preference = await getPreference(userId, eventType);
  return preference?.inAppEnabled ?? true;
}

async function shouldPublishLiveNotification(userId: string, eventType: string) {
  const preference = await getPreference(userId, eventType);
  return preference?.liveEnabled ?? true;
}

async function publishUnreadCountEvent(userId: string, event: {
  kind: "notification_created" | "notification_read";
  notificationId?: string;
  notificationType?: string;
}) {
  const unreadCount = await prisma.notification.count({
    where: {
      destinataireId: userId,
      isRead: false,
    },
  });

  publishNotificationRealtimeEvent({
    kind: event.kind,
    userId,
    unreadCount,
    notificationId: event.notificationId ?? "",
    notificationType: event.notificationType ?? "Notification",
  });
}

function getRetryDelayMs(nextAttempt: number) {
  return Math.min(30_000 * nextAttempt, 5 * 60_000);
}

export async function createNotification(input: NotificationInput) {
  const inAppEnabled = await shouldCreateInAppNotification(input.destinataireId, input.type);

  if (!inAppEnabled) {
    return null;
  }

  const createdNotification = await prisma.notification.create({
    data: input,
  });

  const liveEnabled = await shouldPublishLiveNotification(input.destinataireId, input.type);

  if (liveEnabled) {
    await publishUnreadCountEvent(input.destinataireId, {
      kind: "notification_created",
      notificationId: createdNotification.id,
      notificationType: createdNotification.type,
    });
  }

  return createdNotification;
}

export async function enqueueNotificationDispatchJob(input: DispatchJobInput) {
  if (input.recipientIds.length === 0) {
    return null;
  }

  return prisma.notificationDispatchJob.create({
    data: {
      eventType: input.eventType,
      title: input.title,
      message: input.message,
      link: input.link,
      recipientIds: input.recipientIds as Prisma.InputJsonValue,
      triggeredByUserId: input.triggeredByUserId,
      payload: input.payload,
    },
  });
}

export async function processPendingNotificationDispatchJobs(limit = 10) {
  const pendingJobs = await prisma.notificationDispatchJob.findMany({
    where: {
      status: {
        in: [NotificationDispatchStatus.PENDING, NotificationDispatchStatus.FAILED],
      },
      availableAt: {
        lte: new Date(),
      },
    },
    orderBy: [{ createdAt: "asc" }],
    take: limit,
  });

  let processed = 0;

  for (const job of pendingJobs) {
    const nextAttempt = job.attempts + 1;

    await prisma.notificationDispatchJob.update({
      where: { id: job.id },
      data: {
        status: NotificationDispatchStatus.PROCESSING,
        attempts: nextAttempt,
        lastError: null,
      },
    });

    try {
      const recipientIds = Array.isArray(job.recipientIds)
        ? job.recipientIds.filter((value): value is string => typeof value === "string")
        : [];

      for (const recipientId of recipientIds) {
        await createNotification({
          destinataireId: recipientId,
          type: job.eventType,
          titre: job.title,
          message: job.message,
          lien: job.link ?? undefined,
        });
      }

      await prisma.notificationDispatchJob.update({
        where: { id: job.id },
        data: {
          status: NotificationDispatchStatus.COMPLETED,
          processedAt: new Date(),
          lastError: null,
        },
      });

      processed += 1;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "notification_dispatch_failed";
      const hasRemainingAttempts = nextAttempt < NOTIFICATION_DISPATCH_MAX_ATTEMPTS;

      await prisma.notificationDispatchJob.update({
        where: { id: job.id },
        data: {
          status: hasRemainingAttempts
            ? NotificationDispatchStatus.PENDING
            : NotificationDispatchStatus.FAILED,
          availableAt: hasRemainingAttempts
            ? new Date(Date.now() + getRetryDelayMs(nextAttempt))
            : job.availableAt,
          lastError: errorMessage,
        },
      });
    }
  }

  return {
    processed,
    pending: pendingJobs.length - processed,
  };
}

export async function createNotificationsForRoles(
  roles: Role[],
  input: Omit<NotificationInput, "destinataireId">,
  excludeUserIds: string[] = [],
) {
  const recipients = await prisma.user.findMany({
    where: {
      role: {
        in: roles,
      },
      isActive: true,
      id: {
        notIn: excludeUserIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (recipients.length === 0) {
    return;
  }

  if (recipients.length > HEAVY_NOTIFICATION_RECIPIENT_THRESHOLD) {
    await enqueueNotificationDispatchJob({
      eventType: input.type,
      title: input.titre,
      message: input.message,
      link: input.lien,
      recipientIds: recipients.map((recipient) => recipient.id),
    });

    await processPendingNotificationDispatchJobs(5);
    return;
  }

  for (const recipient of recipients) {
    await createNotification({
      ...input,
      destinataireId: recipient.id,
    });
  }
}

export async function ensureEndingSoonNotifications(referenceDate = new Date()) {
  const soonDate = new Date(referenceDate);
  soonDate.setDate(soonDate.getDate() + 15);

  const stages = await prisma.stage.findMany({
    where: {
      statut: {
        in: ["PLANIFIE", "EN_COURS", "SUSPENDU"],
      },
      dateFin: {
        gte: referenceDate,
        lte: soonDate,
      },
    },
    include: {
      stagiaire: {
        include: {
          user: true,
        },
      },
    },
  });

  for (const stage of stages) {
    const targetLink = `/stagiaires/${stage.stagiaireId}`;
    const title = "Fin de stage proche";
    const message = `Le stage de ${`${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom}`.trim()} se termine bientot.`;

    const recipientIds = new Set<string>();

    if (stage.encadrantId) {
      recipientIds.add(stage.encadrantId);
    }

    const adminsAndRh = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "RH"],
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    for (const user of adminsAndRh) {
      recipientIds.add(user.id);
    }

    for (const destinataireId of recipientIds) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          destinataireId,
          type: "STAGE_ENDING_SOON",
          lien: targetLink,
        },
        select: {
          id: true,
        },
      });

      if (!existingNotification) {
        await createNotification({
          destinataireId,
          type: "STAGE_ENDING_SOON",
          titre: title,
          message,
          lien: targetLink,
        });
      }
    }
  }
}

export async function queueEvaluationScheduledNotification(input: {
  recipientIds: string[];
  stageId: string;
  typeLabel: string;
  scheduledFor: string;
  triggeredByUserId?: string;
}) {
  await enqueueNotificationDispatchJob({
    eventType: "EVALUATION_SCHEDULED",
    title: "Evaluation planifiee",
    message: `Une evaluation ${input.typeLabel} est planifiee pour le ${input.scheduledFor}.`,
    link: `/stages?highlight=${input.stageId}`,
    recipientIds: input.recipientIds,
    triggeredByUserId: input.triggeredByUserId,
    payload: {
      stageId: input.stageId,
      typeLabel: input.typeLabel,
      scheduledFor: input.scheduledFor,
    },
  });
}

export async function queueDocumentRejectedNotification(input: {
  recipientIds: string[];
  stageId: string;
  documentName: string;
  documentId?: string;
  triggeredByUserId?: string;
}) {
  await enqueueNotificationDispatchJob({
    eventType: "DOCUMENT_REJECTED",
    title: "Document rejete",
    message: `Le document ${input.documentName} a ete rejete et demande une nouvelle action.`,
    link: input.documentId ? `/documents/${input.documentId}` : `/stages?highlight=${input.stageId}`,
    recipientIds: input.recipientIds,
    triggeredByUserId: input.triggeredByUserId,
    payload: {
      stageId: input.stageId,
      documentName: input.documentName,
      documentId: input.documentId,
    },
  });
}

export function getNotificationTypeLabel(type: string) {
  const labels: Record<string, string> = {
    STAGIAIRE_CREATED: "Nouveau stagiaire",
    RAPPORT_SUBMITTED: "Rapport soumis",
    RAPPORT_RETURNED: "Rapport retourne",
    STAGE_ENDING_SOON: "Fin de stage proche",
    GITHUB_SYNC_SUCCESS: "Synchro GitHub terminee",
    GITHUB_SYNC_FAILED: "Synchro GitHub echouee",
    EVALUATION_SCHEDULED: "Evaluation planifiee",
    DOCUMENT_REJECTED: "Document rejete",
  };

  return labels[type] ?? "Notification";
}
