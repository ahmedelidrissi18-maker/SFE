"use server";

import { Prisma, Role, type StageStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/rbac";
import { hasActiveStageConflict } from "@/lib/stages";
import { stageFormSchema } from "@/lib/validations/stage";

export type StageActionState = {
  error?: string;
};

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function getRedirectTarget(path: string, success: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}success=${success}`;
}

async function getStageManagerSession() {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, ["ADMIN", "RH"])) {
    return null;
  }

  return session;
}

async function assertNoActiveStageConflict(
  stagiaireId: string,
  nextStatus: StageStatus,
  stageId?: string,
) {
  const existingStages = await prisma.stage.findMany({
    where: { stagiaireId },
    select: {
      id: true,
      statut: true,
    },
  });

  return hasActiveStageConflict(existingStages, nextStatus, stageId);
}

export async function createStageAction(
  _previousState: StageActionState,
  formData: FormData,
): Promise<StageActionState> {
  const session = await getStageManagerSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = stageFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const data = parsedData.data;

  if (await assertNoActiveStageConflict(data.stagiaireId, data.statut)) {
    return {
      error: "Ce stagiaire possede deja un stage actif. Terminez ou suspendez le stage existant avant d'en creer un nouveau.",
    };
  }

  try {
    const createdStage = await prisma.stage.create({
      data: {
        stagiaireId: data.stagiaireId,
        encadrantId: data.encadrantId,
        dateDebut: parseDate(data.dateDebut),
        dateFin: parseDate(data.dateFin),
        departement: data.departement,
        sujet: data.sujet,
        githubRepo: data.githubRepo,
        statut: data.statut,
      },
    });

    await logAuditEvent({
      userId: session.user.id,
      action: "STAGE_CREATE",
      entite: "Stage",
      entiteId: createdStage.id,
      nouvelleValeur: {
        stagiaireId: data.stagiaireId,
        encadrantId: data.encadrantId,
        statut: data.statut,
      },
    });
  } catch (error) {
    console.error(error);
    return {
      error:
        error instanceof Prisma.PrismaClientKnownRequestError
          ? "Creation du stage impossible pour le moment."
          : "Creation du stage impossible pour le moment.",
    };
  }

  revalidatePath("/stages");
  revalidatePath(`/stagiaires/${data.stagiaireId}`);
  redirect(getRedirectTarget(`/stagiaires/${data.stagiaireId}`, "stage-created"));
}

export async function updateStageAction(
  _previousState: StageActionState,
  formData: FormData,
): Promise<StageActionState> {
  const session = await getStageManagerSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = stageFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const data = parsedData.data;

  if (!data.stageId) {
    return {
      error: "Identifiant du stage invalide.",
    };
  }

  const existingStage = await prisma.stage.findUnique({
    where: { id: data.stageId },
    select: {
      id: true,
      stagiaireId: true,
    },
  });

  if (!existingStage) {
    return {
      error: "Stage introuvable.",
    };
  }

  if (data.stagiaireId !== existingStage.stagiaireId) {
    return {
      error: "Le stagiaire rattache a ce stage ne peut pas etre modifie.",
    };
  }

  if (await assertNoActiveStageConflict(existingStage.stagiaireId, data.statut, data.stageId)) {
    return {
      error: "Ce stagiaire possede deja un autre stage actif. Modifiez d'abord le stage existant.",
    };
  }

  try {
    await prisma.stage.update({
      where: { id: data.stageId },
      data: {
        encadrantId: data.encadrantId,
        dateDebut: parseDate(data.dateDebut),
        dateFin: parseDate(data.dateFin),
        departement: data.departement,
        sujet: data.sujet,
        githubRepo: data.githubRepo,
        statut: data.statut,
      },
    });

    await logAuditEvent({
      userId: session.user.id,
      action: "STAGE_UPDATE",
      entite: "Stage",
      entiteId: data.stageId,
      nouvelleValeur: {
        stagiaireId: data.stagiaireId,
        encadrantId: data.encadrantId,
        statut: data.statut,
      },
    });
  } catch (error) {
    console.error(error);
    return {
      error: "Modification du stage impossible pour le moment.",
    };
  }

  revalidatePath("/stages");
  revalidatePath(`/stagiaires/${existingStage.stagiaireId}`);
  redirect(getRedirectTarget(`/stagiaires/${existingStage.stagiaireId}`, "stage-updated"));
}

export async function getStageFormOptions() {
  const [stagiaires, encadrants] = await Promise.all([
    prisma.stagiaire.findMany({
      where: {
        user: {
          role: Role.STAGIAIRE,
        },
      },
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: [{ user: { prenom: "asc" } }, { user: { nom: "asc" } }],
    }),
    prisma.user.findMany({
      where: {
        role: Role.ENCADRANT,
        isActive: true,
      },
      orderBy: [{ prenom: "asc" }, { nom: "asc" }],
      select: {
        id: true,
        nom: true,
        prenom: true,
      },
    }),
  ]);

  return {
    stagiaires: stagiaires.map((stagiaire) => ({
      id: stagiaire.id,
      label: `${stagiaire.user.prenom} ${stagiaire.user.nom}`.trim(),
    })),
    encadrants: encadrants.map((encadrant) => ({
      id: encadrant.id,
      label: `${encadrant.prenom} ${encadrant.nom}`.trim(),
    })),
  };
}
