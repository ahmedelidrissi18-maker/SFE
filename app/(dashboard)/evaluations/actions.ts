"use server";

import {
  EvaluationRevisionAction,
  EvaluationStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logAuditEvent } from "@/lib/audit";
import {
  calculateEvaluationScore,
  canEditEvaluation,
  canManageEvaluationForStage,
  canReviewEvaluation,
  getEvaluationGridDefinition,
  getEvaluationTypeLabel,
  getEvaluationVisibilityFilter,
  normalizeEvaluationCriteriaSnapshot,
} from "@/lib/evaluations";
import { queueEvaluationScheduledNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/rbac";
import { evaluationFormSchema, evaluationReviewSchema } from "@/lib/validations/evaluation";

export type EvaluationActionState = {
  error?: string;
};

function parseOptionalDate(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function getRedirectTarget(path: string, success: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}success=${success}`;
}

async function getEvaluationEditorSession() {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, ["ADMIN", "RH", "ENCADRANT"])) {
    return null;
  }

  return session;
}

async function getEvaluationReviewerSession() {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, ["ADMIN", "RH"])) {
    return null;
  }

  return session;
}

async function getAccessibleStageForEdition(stageId: string, sessionUser: { id: string; role: Role }) {
  const stage = await prisma.stage.findFirst({
    where: {
      id: stageId,
      ...(sessionUser.role === "ENCADRANT" ? { encadrantId: sessionUser.id } : {}),
    },
    include: {
      stagiaire: {
        include: {
          user: true,
        },
      },
      encadrant: true,
    },
  });

  if (!stage) {
    return null;
  }

  const canManage = canManageEvaluationForStage(sessionUser.role, {
    isAssignedEncadrant: stage.encadrantId === sessionUser.id,
  });

  return canManage ? stage : null;
}

async function getScheduleNotificationRecipients(stage: {
  encadrantId: string | null;
}, currentUserId: string) {
  const recipientIds = new Set<string>();

  if (stage.encadrantId) {
    recipientIds.add(stage.encadrantId);
  }

  const adminsAndRh = await prisma.user.findMany({
    where: {
      role: {
        in: [Role.ADMIN, Role.RH],
      },
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  for (const recipient of adminsAndRh) {
    recipientIds.add(recipient.id);
  }

  recipientIds.delete(currentUserId);

  return Array.from(recipientIds);
}

export async function saveEvaluationAction(
  _previousState: EvaluationActionState,
  formData: FormData,
): Promise<EvaluationActionState> {
  const session = await getEvaluationEditorSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = evaluationFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const data = parsedData.data;
  const stage = await getAccessibleStageForEdition(data.stageId, {
    id: session.user.id,
    role: session.user.role,
  });

  if (!stage) {
    return {
      error: "Stage introuvable ou non accessible pour cette evaluation.",
    };
  }

  const scheduledFor = parseOptionalDate(data.scheduledFor);

  try {
    const existingEvaluation = data.evaluationId
      ? await prisma.evaluation.findFirst({
          where: {
            id: data.evaluationId,
            ...getEvaluationVisibilityFilter(session.user.role, session.user.id),
          },
          select: {
            id: true,
            stageId: true,
            type: true,
            status: true,
            notes: true,
            totalScore: true,
            criteriaSnapshot: true,
            scheduledFor: true,
            submittedAt: true,
            submittedByUserId: true,
          },
        })
      : null;

    if (data.evaluationId && !existingEvaluation) {
      return {
        error: "Evaluation introuvable.",
      };
    }

    if (existingEvaluation && !canEditEvaluation(existingEvaluation.status)) {
      return {
        error: "Cette evaluation ne peut plus etre modifiee dans son statut actuel.",
      };
    }

    if (existingEvaluation && existingEvaluation.stageId !== data.stageId) {
      return {
        error: "Le stage rattache a cette evaluation ne peut pas etre modifie.",
      };
    }

    if (existingEvaluation && existingEvaluation.type !== data.type) {
      return {
        error: "Le type d evaluation ne peut pas etre modifie apres creation.",
      };
    }

    const criteriaSnapshot = existingEvaluation
      ? normalizeEvaluationCriteriaSnapshot(existingEvaluation.criteriaSnapshot, existingEvaluation.type)
      : getEvaluationGridDefinition(data.type).criteria;
    const scoreSummary = calculateEvaluationScore(criteriaSnapshot, data.notesJson);
    const nextStatus =
      data.intent === "submit"
        ? EvaluationStatus.SOUMIS
        : existingEvaluation?.status === EvaluationStatus.RETOURNE
          ? EvaluationStatus.RETOURNE
          : EvaluationStatus.BROUILLON;
    const revisionAction =
      data.intent === "submit"
        ? EvaluationRevisionAction.SUBMIT
        : existingEvaluation
          ? EvaluationRevisionAction.UPDATE_DRAFT
          : EvaluationRevisionAction.CREATE;

    const savedEvaluation = existingEvaluation
      ? await prisma.evaluation.update({
          where: { id: existingEvaluation.id },
          data: {
            notes: scoreSummary.notes as Prisma.InputJsonValue,
            totalScore: scoreSummary.totalScore,
            maxScore: scoreSummary.maxScore,
            commentaire: data.commentaire,
            commentaireEncadrant: data.commentaireEncadrant,
            scheduledFor,
            status: nextStatus,
            submittedAt: data.intent === "submit" ? new Date() : existingEvaluation.submittedAt,
            submittedByUserId:
              data.intent === "submit"
                ? session.user.id
                : existingEvaluation.submittedByUserId,
            validatedAt: null,
            validatedByUserId: null,
            returnedAt: data.intent === "submit" ? null : undefined,
            returnedByUserId: data.intent === "submit" ? null : undefined,
          },
        })
      : await prisma.evaluation.create({
          data: {
            stageId: stage.id,
            type: data.type,
            status: nextStatus,
            gridVersion: getEvaluationGridDefinition(data.type).version,
            criteriaSnapshot: criteriaSnapshot as Prisma.InputJsonValue,
            notes: scoreSummary.notes as Prisma.InputJsonValue,
            totalScore: scoreSummary.totalScore,
            maxScore: scoreSummary.maxScore,
            commentaire: data.commentaire,
            commentaireEncadrant: data.commentaireEncadrant,
            scheduledFor,
            createdByUserId: session.user.id,
            submittedAt: data.intent === "submit" ? new Date() : null,
            submittedByUserId: data.intent === "submit" ? session.user.id : null,
          },
        });

    await prisma.evaluationRevision.create({
      data: {
        evaluationId: savedEvaluation.id,
        action: revisionAction,
        previousStatus: existingEvaluation?.status,
        nextStatus,
        previousNotes: existingEvaluation?.notes as Prisma.InputJsonValue | undefined,
        nextNotes: scoreSummary.notes as Prisma.InputJsonValue,
        previousScore: existingEvaluation?.totalScore,
        nextScore: scoreSummary.totalScore,
        commentSnapshot: {
          commentaire: data.commentaire,
          commentaireEncadrant: data.commentaireEncadrant,
          commentaireRh: null,
        } as Prisma.InputJsonValue,
        changedByUserId: session.user.id,
      },
    });

    await logAuditEvent({
      userId: session.user.id,
      action:
        revisionAction === EvaluationRevisionAction.SUBMIT
          ? existingEvaluation
            ? "EVALUATION_RESUBMIT"
            : "EVALUATION_CREATE_AND_SUBMIT"
          : existingEvaluation
            ? "EVALUATION_UPDATE_DRAFT"
            : "EVALUATION_CREATE_DRAFT",
      entite: "Evaluation",
      entiteId: savedEvaluation.id,
      ancienneValeur: existingEvaluation
        ? {
            status: existingEvaluation.status,
            totalScore: existingEvaluation.totalScore,
          }
        : undefined,
      nouvelleValeur: {
        stageId: stage.id,
        type: data.type,
        status: nextStatus,
        totalScore: scoreSummary.totalScore,
        maxScore: scoreSummary.maxScore,
        scheduledFor,
      },
    });

    const scheduleChanged =
      Boolean(scheduledFor) &&
      (!existingEvaluation ||
        existingEvaluation.scheduledFor?.toISOString() !== scheduledFor?.toISOString());

    if (scheduleChanged && scheduledFor) {
      const recipientIds = await getScheduleNotificationRecipients(stage, session.user.id);

      if (recipientIds.length > 0) {
        await queueEvaluationScheduledNotification({
          recipientIds,
          stageId: stage.id,
          typeLabel: getEvaluationTypeLabel(data.type),
          scheduledFor: new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(scheduledFor),
          triggeredByUserId: session.user.id,
        });
      }
    }

    revalidatePath("/evaluations");
    revalidatePath("/notifications");
    revalidatePath(`/evaluations/${savedEvaluation.id}`);
    revalidatePath(`/stagiaires/${stage.stagiaireId}`);
    redirect(
      getRedirectTarget(
        `/evaluations/${savedEvaluation.id}`,
        data.intent === "submit" ? "submitted" : "saved",
      ),
    );
  } catch (error) {
    console.error(error);

    return {
      error:
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
          ? "Une evaluation existe deja pour ce type sur ce stage."
          : "Enregistrement de l evaluation impossible pour le moment.",
    };
  }
}

export async function reviewEvaluationAction(
  _previousState: EvaluationActionState,
  formData: FormData,
): Promise<EvaluationActionState> {
  const session = await getEvaluationReviewerSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = evaluationReviewSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const data = parsedData.data;

  const evaluation = await prisma.evaluation.findFirst({
    where: {
      id: data.evaluationId,
      ...getEvaluationVisibilityFilter(session.user.role, session.user.id),
    },
    select: {
      id: true,
      status: true,
      notes: true,
      totalScore: true,
      commentaire: true,
      commentaireEncadrant: true,
      commentaireRh: true,
      stage: {
        select: {
          stagiaireId: true,
        },
      },
    },
  });

  if (!evaluation) {
    return {
      error: "Evaluation introuvable ou non accessible.",
    };
  }

  if (!canReviewEvaluation(evaluation.status)) {
    return {
      error: "Seules les evaluations soumises peuvent etre traitees.",
    };
  }

  const nextStatus =
    data.intent === "validate" ? EvaluationStatus.VALIDE : EvaluationStatus.RETOURNE;

  try {
    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        status: nextStatus,
        commentaireRh: data.commentaireRh,
        validatedAt: data.intent === "validate" ? new Date() : null,
        validatedByUserId: data.intent === "validate" ? session.user.id : null,
        returnedAt: data.intent === "return" ? new Date() : null,
        returnedByUserId: data.intent === "return" ? session.user.id : null,
      },
    });

    await prisma.evaluationRevision.create({
      data: {
        evaluationId: evaluation.id,
        action:
          data.intent === "validate"
            ? EvaluationRevisionAction.VALIDATE
            : EvaluationRevisionAction.RETURN,
        previousStatus: evaluation.status,
        nextStatus,
        previousNotes: evaluation.notes as Prisma.InputJsonValue,
        nextNotes: evaluation.notes as Prisma.InputJsonValue,
        previousScore: evaluation.totalScore,
        nextScore: evaluation.totalScore,
        commentSnapshot: {
          commentaire: evaluation.commentaire,
          commentaireEncadrant: evaluation.commentaireEncadrant,
          commentaireRh: data.commentaireRh,
        } as Prisma.InputJsonValue,
        changedByUserId: session.user.id,
      },
    });

    await logAuditEvent({
      userId: session.user.id,
      action: data.intent === "validate" ? "EVALUATION_VALIDATE" : "EVALUATION_RETURN",
      entite: "Evaluation",
      entiteId: evaluation.id,
      ancienneValeur: {
        status: evaluation.status,
      },
      nouvelleValeur: {
        status: nextStatus,
        commentaireRh: data.commentaireRh,
      },
    });
  } catch (error) {
    console.error(error);

    return {
      error: "Traitement de l evaluation impossible pour le moment.",
    };
  }

  revalidatePath("/evaluations");
  revalidatePath(`/evaluations/${evaluation.id}`);
  revalidatePath(`/stagiaires/${evaluation.stage.stagiaireId}`);
  redirect(
    getRedirectTarget(
      `/evaluations/${evaluation.id}`,
      data.intent === "validate" ? "validated" : "returned",
    ),
  );
}

export async function getEvaluationFormOptions() {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, ["ADMIN", "RH", "ENCADRANT"])) {
    return {
      stages: [],
    };
  }

  const stages = await prisma.stage.findMany({
    where: {
      ...(session.user.role === "ENCADRANT" ? { encadrantId: session.user.id } : {}),
    },
    include: {
      stagiaire: {
        include: {
          user: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
      },
    },
    orderBy: [{ dateDebut: "desc" }],
  });

  return {
    stages: stages.map((stage) => ({
      id: stage.id,
      label: `${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom} · ${stage.departement} · ${stage.sujet}`,
      stagiaireId: stage.stagiaireId,
    })),
  };
}
