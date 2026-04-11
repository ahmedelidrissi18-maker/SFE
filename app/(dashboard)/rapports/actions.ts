"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logAuditEvent } from "@/lib/audit";
import { createNotification, createNotificationsForRoles } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { canEditRapport, canReviewRapport } from "@/lib/rapports";
import { hasRole } from "@/lib/rbac";
import { rapportFormSchema, rapportReviewSchema } from "@/lib/validations/rapport";

export type RapportActionState = {
  error?: string;
};

function getRedirectTarget(path: string, success: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}success=${success}`;
}

async function getStagiaireSession() {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, ["STAGIAIRE"])) {
    return null;
  }

  return session;
}

async function getReviewerSession() {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, ["ADMIN", "RH", "ENCADRANT"])) {
    return null;
  }

  return session;
}

export async function saveRapportAction(
  _previousState: RapportActionState,
  formData: FormData,
): Promise<RapportActionState> {
  const session = await getStagiaireSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = rapportFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const data = parsedData.data;
  const nextStatus = data.intent === "submit" ? "SOUMIS" : "BROUILLON";

  const stage = await prisma.stage.findFirst({
    where: {
      id: data.stageId,
      stagiaire: {
        userId: session.user.id,
      },
    },
    select: {
      id: true,
      encadrantId: true,
      stagiaireId: true,
      sujet: true,
      stagiaire: {
        select: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      },
    },
  });

  if (!stage) {
    return {
      error: "Stage introuvable ou non accessible.",
    };
  }

  try {
    if (data.rapportId) {
      const existingRapport = await prisma.rapport.findFirst({
        where: {
          id: data.rapportId,
          stage: {
            stagiaire: {
              userId: session.user.id,
            },
          },
        },
        select: {
          id: true,
          stageId: true,
          statut: true,
        },
      });

      if (!existingRapport) {
        return {
          error: "Rapport introuvable.",
        };
      }

      if (!canEditRapport(existingRapport.statut)) {
        return {
          error: "Ce rapport ne peut plus etre modifie par le stagiaire.",
        };
      }

      if (existingRapport.stageId !== stage.id) {
        return {
          error: "Le stage rattache a ce rapport ne peut pas etre modifie.",
        };
      }

      const updatedRapport = await prisma.rapport.update({
        where: { id: data.rapportId },
        data: {
          semaine: data.semaine,
          tachesRealisees: data.tachesRealisees,
          difficultes: data.difficultes,
          planSuivant: data.planSuivant,
          avancement: data.avancement,
          statut: nextStatus,
          dateSoumission: data.intent === "submit" ? new Date() : null,
        },
      });

      await logAuditEvent({
        userId: session.user.id,
        action: data.intent === "submit" ? "RAPPORT_SUBMIT" : "RAPPORT_DRAFT_SAVE",
        entite: "Rapport",
        entiteId: updatedRapport.id,
        nouvelleValeur: {
          stageId: updatedRapport.stageId,
          semaine: updatedRapport.semaine,
          statut: updatedRapport.statut,
          avancement: updatedRapport.avancement,
        },
      });

      if (data.intent === "submit") {
        if (stage.encadrantId) {
          await createNotification({
            destinataireId: stage.encadrantId,
            type: "RAPPORT_SUBMITTED",
            titre: "Nouveau rapport soumis",
            message: `${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom} a soumis son rapport de la semaine ${updatedRapport.semaine}.`,
            lien: `/rapports/${updatedRapport.id}`,
          });
        }

        await createNotificationsForRoles(
          ["ADMIN", "RH"],
          {
            type: "RAPPORT_SUBMITTED",
            titre: "Rapport soumis",
            message: `${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom} a soumis un nouveau rapport.`,
            lien: `/rapports/${updatedRapport.id}`,
          },
          [session.user.id],
        );
      }

      revalidatePath("/rapports");
      revalidatePath("/notifications");
      revalidatePath(`/rapports/${updatedRapport.id}`);
      redirect(getRedirectTarget(`/rapports/${updatedRapport.id}`, data.intent === "submit" ? "submitted" : "saved"));
    }

    const createdRapport = await prisma.rapport.create({
      data: {
        stageId: stage.id,
        semaine: data.semaine,
        tachesRealisees: data.tachesRealisees,
        difficultes: data.difficultes,
        planSuivant: data.planSuivant,
        avancement: data.avancement,
        statut: nextStatus,
        dateSoumission: data.intent === "submit" ? new Date() : null,
      },
    });

    await logAuditEvent({
      userId: session.user.id,
      action: data.intent === "submit" ? "RAPPORT_CREATE_AND_SUBMIT" : "RAPPORT_CREATE_DRAFT",
      entite: "Rapport",
      entiteId: createdRapport.id,
      nouvelleValeur: {
        stageId: createdRapport.stageId,
        semaine: createdRapport.semaine,
        statut: createdRapport.statut,
        avancement: createdRapport.avancement,
      },
    });

    if (data.intent === "submit") {
      if (stage.encadrantId) {
        await createNotification({
          destinataireId: stage.encadrantId,
          type: "RAPPORT_SUBMITTED",
          titre: "Nouveau rapport soumis",
          message: `${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom} a soumis son rapport de la semaine ${createdRapport.semaine}.`,
          lien: `/rapports/${createdRapport.id}`,
        });
      }

      await createNotificationsForRoles(
        ["ADMIN", "RH"],
        {
          type: "RAPPORT_SUBMITTED",
          titre: "Rapport soumis",
          message: `${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom} a soumis un nouveau rapport.`,
          lien: `/rapports/${createdRapport.id}`,
        },
        [session.user.id],
      );
    }

    revalidatePath("/rapports");
    revalidatePath("/notifications");
    revalidatePath(`/rapports/${createdRapport.id}`);
    redirect(getRedirectTarget(`/rapports/${createdRapport.id}`, data.intent === "submit" ? "submitted" : "saved"));
  } catch (error) {
    console.error(error);

    return {
      error:
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
          ? "Un rapport existe deja pour cette semaine sur ce stage."
          : "Enregistrement du rapport impossible pour le moment.",
    };
  }
}

export async function reviewRapportAction(
  _previousState: RapportActionState,
  formData: FormData,
): Promise<RapportActionState> {
  const session = await getReviewerSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = rapportReviewSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const data = parsedData.data;

  const rapport = await prisma.rapport.findFirst({
    where: {
      id: data.rapportId,
      ...(session.user.role === "ENCADRANT"
        ? {
            stage: {
              encadrantId: session.user.id,
            },
          }
        : {}),
    },
    select: {
      id: true,
      statut: true,
      semaine: true,
      stage: {
        select: {
          id: true,
          stagiaire: {
            select: {
              userId: true,
              user: {
                select: {
                  nom: true,
                  prenom: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!rapport) {
    return {
      error: "Rapport introuvable ou non accessible.",
    };
  }

  if (!canReviewRapport(rapport.statut)) {
    return {
      error: "Seuls les rapports soumis peuvent etre traites.",
    };
  }

  const nextStatus = data.intent === "validate" ? "VALIDE" : "RETOURNE";

  try {
    await prisma.rapport.update({
      where: { id: rapport.id },
      data: {
        statut: nextStatus,
        commentaireEncadrant: data.commentaireEncadrant,
      },
    });

    await logAuditEvent({
      userId: session.user.id,
      action: data.intent === "validate" ? "RAPPORT_VALIDATE" : "RAPPORT_RETURN",
      entite: "Rapport",
      entiteId: rapport.id,
      nouvelleValeur: {
        statut: nextStatus,
        commentaireEncadrant: data.commentaireEncadrant,
      },
    });

    if (data.intent === "return") {
      await createNotification({
        destinataireId: rapport.stage.stagiaire.userId,
        type: "RAPPORT_RETURNED",
        titre: "Rapport retourne",
        message: `Votre rapport de la semaine ${rapport.semaine} a ete retourne avec commentaire.`,
        lien: `/rapports/${rapport.id}`,
      });
    }
  } catch (error) {
    console.error(error);

    return {
      error: "Traitement du rapport impossible pour le moment.",
    };
  }

  revalidatePath("/rapports");
  revalidatePath("/notifications");
  revalidatePath(`/rapports/${rapport.id}`);
  redirect(getRedirectTarget(`/rapports/${rapport.id}`, data.intent === "validate" ? "validated" : "returned"));
}
