"use server";

import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/rbac";
import { stagiaireFormSchema } from "@/lib/validations/stagiaire";

export type StagiaireActionState = {
  error?: string;
};

async function getStaffSession() {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, ["ADMIN", "RH"])) {
    return null;
  }

  return session;
}

function parseOptionalDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function getRedirectTarget(path: string, success: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}success=${success}`;
}

export async function createStagiaireAction(
  _previousState: StagiaireActionState,
  formData: FormData,
): Promise<StagiaireActionState> {
  const session = await getStaffSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = stagiaireFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const data = parsedData.data;

  try {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          passwordHash,
          role: Role.STAGIAIRE,
        },
      });

      const stagiaire = await tx.stagiaire.create({
        data: {
          userId: user.id,
          cin: data.cin,
          telephone: data.telephone,
          dateNaissance: parseOptionalDate(data.dateNaissance),
          etablissement: data.etablissement,
          specialite: data.specialite,
          niveau: data.niveau,
          annee: data.annee,
          photoUrl: data.photoUrl,
        },
      });

      return { user, stagiaire };
    });

    await logAuditEvent({
      userId: session.user.id,
      action: "STAGIAIRE_CREATE",
      entite: "Stagiaire",
      entiteId: created.stagiaire.id,
      nouvelleValeur: {
        userId: created.user.id,
        email: created.user.email,
        cin: created.stagiaire.cin,
      },
    });
  } catch (error) {
    console.error(error);
    return {
      error:
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
          ? "Un stagiaire avec cet email ou ce CIN existe deja."
          : "Creation impossible pour le moment.",
    };
  }

  revalidatePath("/stagiaires");
  redirect(getRedirectTarget("/stagiaires", "created"));
}

export async function updateStagiaireAction(
  _previousState: StagiaireActionState,
  formData: FormData,
): Promise<StagiaireActionState> {
  const session = await getStaffSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = stagiaireFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const data = parsedData.data;
  if (!data.stagiaireId || !data.userId) {
    return {
      error: "Identifiants du stagiaire invalides.",
    };
  }

  const stagiaireId = data.stagiaireId;
  const userId = data.userId;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
        },
      });

      await tx.stagiaire.update({
        where: { id: stagiaireId },
        data: {
          cin: data.cin,
          telephone: data.telephone,
          dateNaissance: parseOptionalDate(data.dateNaissance),
          etablissement: data.etablissement,
          specialite: data.specialite,
          niveau: data.niveau,
          annee: data.annee,
          photoUrl: data.photoUrl,
        },
      });
    });

    await logAuditEvent({
      userId: session.user.id,
      action: "STAGIAIRE_UPDATE",
      entite: "Stagiaire",
      entiteId: stagiaireId,
      nouvelleValeur: {
        email: data.email,
        cin: data.cin,
      },
    });
  } catch (error) {
    console.error(error);
    return {
      error:
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
          ? "Un autre utilisateur utilise deja cet email ou ce CIN."
          : "Modification impossible pour le moment.",
    };
  }

  revalidatePath("/stagiaires");
  revalidatePath(`/stagiaires/${stagiaireId}`);
  redirect(getRedirectTarget(`/stagiaires/${stagiaireId}`, "updated"));
}

export async function toggleStagiaireArchiveAction(formData: FormData) {
  const session = await getStaffSession();

  if (!session?.user) {
    return;
  }

  const userId = String(formData.get("userId") ?? "");
  const stagiaireId = String(formData.get("stagiaireId") ?? "");
  const nextActiveValue = String(formData.get("nextActiveValue") ?? "") === "true";
  const returnTo = String(formData.get("returnTo") ?? `/stagiaires/${stagiaireId}`);

  if (!userId || !stagiaireId) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: nextActiveValue,
    },
  });

  await logAuditEvent({
    userId: session.user.id,
    action: nextActiveValue ? "STAGIAIRE_RESTORE" : "STAGIAIRE_ARCHIVE",
    entite: "Stagiaire",
    entiteId: stagiaireId,
    nouvelleValeur: {
      userId,
      isActive: nextActiveValue,
    },
  });

  revalidatePath("/stagiaires");
  revalidatePath(`/stagiaires/${stagiaireId}`);
  redirect(getRedirectTarget(returnTo, nextActiveValue ? "restored" : "archived"));
}
