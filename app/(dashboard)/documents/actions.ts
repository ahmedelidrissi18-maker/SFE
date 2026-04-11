"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logAuditEvent } from "@/lib/audit";
import {
  buildStoredDocumentName,
  canAccessStageDocuments,
  getDocumentStorageRoot,
  validateDocumentUpload,
} from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { documentUploadSchema } from "@/lib/validations/document";

export type DocumentActionState = {
  error?: string;
};

function getRedirectTarget(pathname: string, success: string) {
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}success=${success}`;
}

export async function uploadDocumentAction(
  _previousState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const session = await auth();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const file = formData.get("file");
  const parsedData = documentUploadSchema.safeParse({
    stageId: formData.get("stageId"),
    type: formData.get("type"),
    file,
  });

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Informations du document invalides.",
    };
  }

  const {
    stageId,
    type,
    file: documentFile,
  } = parsedData.data;
  const uploadError = validateDocumentUpload(documentFile);

  if (uploadError) {
    return { error: uploadError };
  }

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: {
      stagiaire: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!stage) {
    return { error: "Stage introuvable." };
  }

  const canAccess = canAccessStageDocuments(session.user.role, {
    isStageOwner: stage.stagiaire.userId === session.user.id,
    isAssignedEncadrant: stage.encadrantId === session.user.id,
  });

  if (!canAccess) {
    return { error: "Vous n avez pas acces a ce stage." };
  }

  const storageRoot = getDocumentStorageRoot();
  const directory = path.join(storageRoot, stage.id);
  const storedFilename = buildStoredDocumentName(documentFile.name);
  const storedFilePath = path.join(directory, storedFilename);
  const buffer = Buffer.from(await documentFile.arrayBuffer());

  try {
    await mkdir(directory, { recursive: true });
    await writeFile(storedFilePath, buffer);

    const latestVersion = await prisma.document.findFirst({
      where: {
        stageId: stage.id,
        nom: documentFile.name,
        type,
      },
      orderBy: [{ version: "desc" }],
      select: {
        version: true,
      },
    });

    const createdDocument = await prisma.document.create({
      data: {
        stageId: stage.id,
        auteurId: session.user.id,
        type,
        nom: documentFile.name,
        url: storedFilePath,
        tailleOctets: documentFile.size,
        version: (latestVersion?.version ?? 0) + 1,
      },
    });

    await logAuditEvent({
      userId: session.user.id,
      action: "DOCUMENT_UPLOAD",
      entite: "Document",
      entiteId: createdDocument.id,
      nouvelleValeur: {
        stageId: stage.id,
        type,
        nom: createdDocument.nom,
        version: createdDocument.version,
      },
    });
  } catch (error) {
    console.error(error);
    return {
      error: "Televersement du document impossible pour le moment.",
    };
  }

  revalidatePath(`/stagiaires/${stage.stagiaireId}`);
  redirect(getRedirectTarget(`/stagiaires/${stage.stagiaireId}`, "document-uploaded"));
}
