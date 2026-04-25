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

const NOTIFICATION_BATCH_CONCURRENCY = 8;

type NotificationPreferenceFlags = {
  inAppEnabled: boolean;
  liveEnabled: boolean;
};

const defaultNotificationPreference: NotificationPreferenceFlags = {
  inAppEnabled: true,
  liveEnabled: true,
};

function getNotificationPreferenceKey(userId: string, eventType: string) {
  return `${userId}::${eventType}`;
}

function chunkArray<T>(items: T[], chunkSize: number) {
  if (chunkSize <= 0 || items.length <= chunkSize) {
    return [items];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

async function getPreference(userId: string, eventType: string): Promise<NotificationPreferenceFlags> {
  const preference = await prisma.notificationPreference.findUnique({
    where: {
      userId_eventType: {
        userId,
        eventType,
      },
    },
    select: {
      inAppEnabled: true,
      liveEnabled: true,
    },
  });

  return preference ?? defaultNotificationPreference;
}

async function getPreferencesForNotificationBatch(
  notifications: NotificationInput[],
): Promise<Map<string, NotificationPreferenceFlags>> {
  const uniqueRecipientIds = [...new Set(notifications.map((notification) => notification.destinataireId))];
  const uniqueEventTypes = [...new Set(notifications.map((notification) => notification.type))];

  if (uniqueRecipientIds.length === 0 || uniqueEventTypes.length === 0) {
    return new Map();
  }

  const preferences = await prisma.notificationPreference.findMany({
    where: {
      userId: {
        in: uniqueRecipientIds,
      },
      eventType: {
        in: uniqueEventTypes,
      },
    },
    select: {
      userId: true,
      eventType: true,
      inAppEnabled: true,
      liveEnabled: true,
    },
  });

  const preferencesByUserAndEvent = new Map<string, NotificationPreferenceFlags>();

  for (const preference of preferences) {
    preferencesByUserAndEvent.set(
      getNotificationPreferenceKey(preference.userId, preference.eventType),
      {
        inAppEnabled: preference.inAppEnabled,
        liveEnabled: preference.liveEnabled,
      },
    );
  }

  return preferencesByUserAndEvent;
}

function publishUnreadCountEvent(userId: string, event: {
  kind: "notification_created" | "notification_read";
  notificationId?: string;
  notificationType?: string;
  unreadCountDelta?: number;
  notification?: {
    id: string;
    type: string;
    titre: string;
    message: string;
    lien: string | null;
    isRead: boolean;
    createdAt: string;
  };
}) {
  if (event.kind === "notification_created" && event.notification) {
    publishNotificationRealtimeEvent({
      kind: "notification_created",
      userId,
      unreadCountDelta: event.unreadCountDelta,
      notificationId: event.notificationId ?? "",
      notificationType: event.notificationType ?? "Notification",
      notification: event.notification,
    });
    return;
  }

  publishNotificationRealtimeEvent({
    kind: "notification_read",
    userId,
    unreadCountDelta: event.unreadCountDelta,
    notificationId: event.notificationId,
  });
}

function getRetryDelayMs(nextAttempt: number) {
  return Math.min(30_000 * nextAttempt, 5 * 60_000);
}

export async function createNotification(
  input: NotificationInput,
  options?: {
    emitRealtime?: boolean;
  },
) {
  const emitRealtime = options?.emitRealtime ?? true;
  const preference = await getPreference(input.destinataireId, input.type);
  const inAppEnabled = preference.inAppEnabled;

  if (!inAppEnabled) {
    return null;
  }

  const createdNotification = await prisma.notification.create({
    data: input,
  });

  const liveEnabled = preference.liveEnabled;

  if (emitRealtime && liveEnabled) {
    publishUnreadCountEvent(input.destinataireId, {
      kind: "notification_created",
      notificationId: createdNotification.id,
      notificationType: createdNotification.type,
      unreadCountDelta: 1,
      notification: {
        id: createdNotification.id,
        type: createdNotification.type,
        titre: createdNotification.titre,
        message: createdNotification.message,
        lien: createdNotification.lien,
        isRead: createdNotification.isRead,
        createdAt: createdNotification.createdAt.toISOString(),
      },
    });
  }

  return createdNotification;
}

async function createNotificationBatch(notificationsToCreate: NotificationInput[]) {
  if (notificationsToCreate.length === 0) {
    return 0;
  }

  const preferencesByUserAndEvent = await getPreferencesForNotificationBatch(notificationsToCreate);
  const notificationsWithInApp = notificationsToCreate.filter((notification) => {
    const preference =
      preferencesByUserAndEvent.get(
        getNotificationPreferenceKey(notification.destinataireId, notification.type),
      ) ?? defaultNotificationPreference;

    return preference.inAppEnabled;
  });

  if (notificationsWithInApp.length === 0) {
    return 0;
  }

  for (const notificationChunk of chunkArray(notificationsWithInApp, NOTIFICATION_BATCH_CONCURRENCY)) {
    await prisma.notification.createMany({
      data: notificationChunk,
    });
  }

  return notificationsWithInApp.length;
}

async function createNotificationsWithSharedPreferences(input: {
  recipientIds: string[];
  notification: Omit<NotificationInput, "destinataireId">;
}) {
  const uniqueRecipientIds = [...new Set(input.recipientIds)];
  if (uniqueRecipientIds.length === 0) {
    return 0;
  }

  return createNotificationBatch(
    uniqueRecipientIds.map((destinataireId) => ({
      ...input.notification,
      destinataireId,
    })),
  );
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

      await createNotificationsWithSharedPreferences({
        recipientIds,
        notification: {
          type: job.eventType,
          titre: job.title,
          message: job.message,
          lien: job.link ?? undefined,
        },
      });

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
    return;
  }

  await createNotificationsWithSharedPreferences({
    recipientIds: recipients.map((recipient) => recipient.id),
    notification: input,
  });
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
  const stageCandidates: Array<{
    link: string;
    title: string;
    message: string;
    recipientIds: string[];
  }> = [];
  const dedupeKeys = new Set<string>();

  for (const stage of stages) {
    const targetLink = `/stagiaires/${stage.stagiaireId}`;
    const title = "Fin de stage proche";
    const message = `Le stage de ${`${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom}`.trim()} se termine bientot.`;

    const recipientIds = new Set<string>();

    if (stage.encadrantId) {
      recipientIds.add(stage.encadrantId);
    }

    for (const user of adminsAndRh) {
      recipientIds.add(user.id);
    }

    const resolvedRecipientIds = [...recipientIds];
    stageCandidates.push({
      link: targetLink,
      title,
      message,
      recipientIds: resolvedRecipientIds,
    });

    for (const destinataireId of resolvedRecipientIds) {
      dedupeKeys.add(`${destinataireId}::${targetLink}`);
    }
  }

  if (stageCandidates.length === 0 || dedupeKeys.size === 0) {
    return {
      scannedStages: stages.length,
      created: 0,
    };
  }

  const candidateRecipientIds = [...new Set([...dedupeKeys].map((key) => key.split("::")[0] ?? ""))]
    .filter((value) => value.length > 0);
  const candidateLinks = [...new Set([...dedupeKeys].map((key) => key.split("::")[1] ?? ""))]
    .filter((value) => value.length > 0);

  const existingNotifications = await prisma.notification.findMany({
    where: {
      destinataireId: {
        in: candidateRecipientIds,
      },
      type: "STAGE_ENDING_SOON",
      lien: {
        in: candidateLinks,
      },
    },
    select: {
      destinataireId: true,
      lien: true,
    },
  });

  const existingKeySet = new Set(
    existingNotifications
      .filter((notification) => notification.lien)
      .map((notification) => `${notification.destinataireId}::${notification.lien}`),
  );

  const notificationsToCreate: NotificationInput[] = [];

  for (const candidate of stageCandidates) {
    for (const recipientId of candidate.recipientIds) {
      const dedupeKey = `${recipientId}::${candidate.link}`;

      if (existingKeySet.has(dedupeKey)) {
        continue;
      }

      existingKeySet.add(dedupeKey);
      notificationsToCreate.push({
        destinataireId: recipientId,
        type: "STAGE_ENDING_SOON",
        titre: candidate.title,
        message: candidate.message,
        lien: candidate.link,
      });
    }
  }

  const created = await createNotificationBatch(notificationsToCreate);

  return {
    scannedStages: stages.length,
    created,
  };
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
