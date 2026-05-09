import { EvaluationType, NotificationDispatchStatus, type Prisma, type Role } from "@prisma/client";
import {
  getNotificationTypeLabel,
  notificationEventDefinitions,
  type NotificationEventType,
} from "@/lib/notification-definitions";
import { publishNotificationRealtimeEvent } from "@/lib/realtime-notifications";
import { getEvaluationTypeLabel } from "@/lib/evaluations";
import { prisma } from "@/lib/prisma";
import { getSuggestedRapportWeek } from "@/lib/rapports";

type NotificationInput = {
  destinataireId: string;
  type: string;
  titre: string;
  message: string;
  lien?: string;
};

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

type NotificationCandidate = {
  type: string;
  title: string;
  message: string;
  link: string;
  recipientIds: string[];
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

function dedupeNotificationRecipientIds(recipientIds: string[]) {
  return [...new Set(recipientIds.filter((value) => value.trim().length > 0))];
}

function getNotificationCandidateKey(input: {
  recipientId: string;
  type: string;
  link: string;
}) {
  return `${input.recipientId}::${input.type}::${input.link}`;
}

async function createDedupedNotificationsFromCandidates(candidates: NotificationCandidate[]) {
  if (candidates.length === 0) {
    return 0;
  }

  const candidateRecipientIds = [...new Set(candidates.flatMap((candidate) => candidate.recipientIds))];
  const candidateTypes = [...new Set(candidates.map((candidate) => candidate.type))];
  const candidateLinks = [...new Set(candidates.map((candidate) => candidate.link))];

  if (
    candidateRecipientIds.length === 0 ||
    candidateTypes.length === 0 ||
    candidateLinks.length === 0
  ) {
    return 0;
  }

  const existingNotifications = await prisma.notification.findMany({
    where: {
      destinataireId: {
        in: candidateRecipientIds,
      },
      type: {
        in: candidateTypes,
      },
      lien: {
        in: candidateLinks,
      },
    },
    select: {
      destinataireId: true,
      type: true,
      lien: true,
    },
  });

  const existingKeySet = new Set(
    existingNotifications
      .filter((notification) => notification.lien)
      .map((notification) =>
        getNotificationCandidateKey({
          recipientId: notification.destinataireId,
          type: notification.type,
          link: notification.lien ?? "",
        }),
      ),
  );

  const notificationsToCreate: NotificationInput[] = [];

  for (const candidate of candidates) {
    for (const recipientId of dedupeNotificationRecipientIds(candidate.recipientIds)) {
      const candidateKey = getNotificationCandidateKey({
        recipientId,
        type: candidate.type,
        link: candidate.link,
      });

      if (existingKeySet.has(candidateKey)) {
        continue;
      }

      existingKeySet.add(candidateKey);
      notificationsToCreate.push({
        destinataireId: recipientId,
        type: candidate.type,
        titre: candidate.title,
        message: candidate.message,
        lien: candidate.link,
      });
    }
  }

  return createNotificationBatch(notificationsToCreate);
}

export function getExpectedRapportWeekForAlerts(input: {
  stageStartDate: Date;
  stageEndDate: Date;
  referenceDate?: Date;
}) {
  const effectiveReferenceDate =
    (input.referenceDate ?? new Date()).getTime() > input.stageEndDate.getTime()
      ? input.stageEndDate
      : input.referenceDate ?? new Date();

  return getSuggestedRapportWeek(input.stageStartDate, [], effectiveReferenceDate);
}

function getDifferenceInDays(from: Date, to: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.floor((to.getTime() - from.getTime()) / millisecondsPerDay);
}

export function resolveMissingEvaluationTypeForAlerts(input: {
  stageStartDate: Date;
  stageEndDate: Date;
  existingTypes: EvaluationType[];
  referenceDate?: Date;
}) {
  const referenceDate = input.referenceDate ?? new Date();

  if (referenceDate.getTime() < input.stageStartDate.getTime()) {
    return null;
  }

  const elapsedDays = getDifferenceInDays(input.stageStartDate, referenceDate);
  const daysUntilEnd = getDifferenceInDays(referenceDate, input.stageEndDate);
  const existingTypes = new Set(input.existingTypes);

  if (elapsedDays >= 7 && !existingTypes.has(EvaluationType.DEBUT_STAGE)) {
    return EvaluationType.DEBUT_STAGE;
  }

  if (elapsedDays >= 28 && !existingTypes.has(EvaluationType.MI_PARCOURS)) {
    return EvaluationType.MI_PARCOURS;
  }

  if (daysUntilEnd <= 7 && !existingTypes.has(EvaluationType.FINAL)) {
    return EvaluationType.FINAL;
  }

  return null;
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

async function claimNotificationDispatchJob(job: {
  id: string;
  status: NotificationDispatchStatus;
  attempts: number;
  availableAt: Date;
  updatedAt: Date;
}) {
  const nextAttempt = job.attempts + 1;
  const claimResult = await prisma.notificationDispatchJob.updateMany({
    where: {
      id: job.id,
      status: job.status,
      availableAt: job.availableAt,
      updatedAt: job.updatedAt,
    },
    data: {
      status: NotificationDispatchStatus.PROCESSING,
      attempts: nextAttempt,
      lastError: null,
    },
  });

  if (claimResult.count === 0) {
    return null;
  }

  return nextAttempt;
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
    const nextAttempt = await claimNotificationDispatchJob(job);

    if (!nextAttempt) {
      continue;
    }

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
  const stageCandidates: NotificationCandidate[] = [];

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
      type: "STAGE_ENDING_SOON",
      link: targetLink,
      title,
      message,
      recipientIds: resolvedRecipientIds,
    });
  }

  if (stageCandidates.length === 0) {
    return {
      scannedStages: stages.length,
      created: 0,
    };
  }
  const created = await createDedupedNotificationsFromCandidates(stageCandidates);

  return {
    scannedStages: stages.length,
    created,
  };
}

export async function ensureAutomatedBusinessAlerts(referenceDate = new Date()) {
  const blockedDocumentThresholdDate = new Date(referenceDate.getTime() - 3 * 24 * 60 * 60 * 1000);
  const [adminsAndRh, activeStages, blockedDocuments] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "RH"],
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    }),
    prisma.stage.findMany({
      where: {
        statut: {
          in: ["EN_COURS", "SUSPENDU"],
        },
      },
      include: {
        stagiaire: {
          include: {
            user: true,
          },
        },
        rapports: {
          select: {
            semaine: true,
            statut: true,
          },
        },
        evaluations: {
          select: {
            type: true,
          },
        },
      },
    }),
    prisma.document.findMany({
      where: {
        isDeleted: false,
        statut: "EN_VERIFICATION",
        validationRequestedAt: {
          lte: blockedDocumentThresholdDate,
        },
      },
      include: {
        stage: {
          include: {
            stagiaire: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    }),
  ]);
  const adminAndRhIds = adminsAndRh.map((user) => user.id);
  const candidates: NotificationCandidate[] = [];
  let overdueRapports = 0;
  let missingEvaluations = 0;
  let blockedDocumentsCount = 0;

  for (const stage of activeStages) {
    if (referenceDate.getTime() < stage.dateDebut.getTime()) {
      continue;
    }

    const expectedWeek = getExpectedRapportWeekForAlerts({
      stageStartDate: stage.dateDebut,
      stageEndDate: stage.dateFin,
      referenceDate,
    });
    const hasExpectedWeekRapport = stage.rapports.some((rapport) => {
      return rapport.semaine === expectedWeek && rapport.statut !== "BROUILLON";
    });

    if (!hasExpectedWeekRapport) {
      overdueRapports += 1;
      candidates.push({
        type: "RAPPORT_OVERDUE",
        title: "Rapport en retard",
        message: `Le rapport de la semaine ${expectedWeek} pour ${`${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom}`.trim()} n a pas encore ete soumis.`,
        link: `/rapports?stageId=${stage.id}&alert=overdue&week=${expectedWeek}`,
        recipientIds: [
          stage.stagiaire.userId,
          ...(stage.encadrantId ? [stage.encadrantId] : []),
          ...adminAndRhIds,
        ],
      });
    }

    const missingEvaluationType = resolveMissingEvaluationTypeForAlerts({
      stageStartDate: stage.dateDebut,
      stageEndDate: stage.dateFin,
      existingTypes: stage.evaluations.map((evaluation) => evaluation.type),
      referenceDate,
    });

    if (missingEvaluationType) {
      missingEvaluations += 1;
      candidates.push({
        type: "EVALUATION_MISSING",
        title: "Evaluation manquante",
        message: `L evaluation ${getEvaluationTypeLabel(missingEvaluationType)} du stage de ${`${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom}`.trim()} reste a preparer.`,
        link: `/evaluations?stageId=${stage.id}&alert=missing-${missingEvaluationType}`,
        recipientIds: [...(stage.encadrantId ? [stage.encadrantId] : []), ...adminAndRhIds],
      });
    }
  }

  for (const document of blockedDocuments) {
    blockedDocumentsCount += 1;
    candidates.push({
      type: "DOCUMENT_BLOCKED",
      title: "Document bloque",
      message: `Le document ${document.nom} de ${`${document.stage.stagiaire.user.prenom} ${document.stage.stagiaire.user.nom}`.trim()} est en verification depuis plus de 3 jours.`,
      link: `/documents/${document.id}`,
      recipientIds: [...(document.stage.encadrantId ? [document.stage.encadrantId] : []), ...adminAndRhIds],
    });
  }

  const created = await createDedupedNotificationsFromCandidates(candidates);

  return {
    created,
    overdueRapports,
    missingEvaluations,
    blockedDocuments: blockedDocumentsCount,
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

export { getNotificationTypeLabel, notificationEventDefinitions, type NotificationEventType };
