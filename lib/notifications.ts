import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationInput = {
  destinataireId: string;
  type: string;
  titre: string;
  message: string;
  lien?: string;
};

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: input,
  });
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

  await prisma.notification.createMany({
    data: recipients.map((recipient) => ({
      ...input,
      destinataireId: recipient.id,
    })),
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
        await prisma.notification.create({
          data: {
            destinataireId,
            type: "STAGE_ENDING_SOON",
            titre: title,
            message,
            lien: targetLink,
          },
        });
      }
    }
  }
}

export function getNotificationTypeLabel(type: string) {
  const labels: Record<string, string> = {
    STAGIAIRE_CREATED: "Nouveau stagiaire",
    RAPPORT_SUBMITTED: "Rapport soumis",
    RAPPORT_RETURNED: "Rapport retourne",
    STAGE_ENDING_SOON: "Fin de stage proche",
  };

  return labels[type] ?? "Notification";
}
