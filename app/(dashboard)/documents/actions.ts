"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logAuditEvent } from "@/lib/audit";
import {
  buildStoredDocumentName,
  canAccessStageDocuments,
  canManageDocumentReview,
  canPrepareDocumentSignature,
  canRequestPdfGeneration,
  canReviewDocument,
  canSubmitDocumentForReview,
  getDocumentStorageRoot,
  getPdfTemplateLabel,
  validateDocumentUpload,
} from "@/lib/documents";
import { queueDocumentRejectedNotification } from "@/lib/notifications";
import { requestGeneration } from "@/lib/pdf-service";
import { prisma } from "@/lib/prisma";
import {
  documentUploadSchema,
  documentWorkflowSchema,
  pdfGenerationRequestSchema,
} from "@/lib/validations/document";

export type DocumentActionState = {
  error?: string;
};

function getRedirectTarget(pathname: string, success: string) {
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}success=${success}`;
}

async function getCurrentSession() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return session;
}

async function getStageForDocumentWorkflow(stageId: string, userId: string, role: string) {
  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
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

  const canAccess = canAccessStageDocuments(role as never, {
    isStageOwner: stage.stagiaire.userId === userId,
    isAssignedEncadrant: stage.encadrantId === userId,
  });

  return canAccess ? stage : null;
}

async function getDocumentForWorkflow(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
    include: {
      stage: {
        include: {
          stagiaire: {
            include: {
              user: true,
            },
          },
          encadrant: true,
        },
      },
      auteur: true,
    },
  });
}

export async function uploadDocumentAction(
  _previousState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const session = await getCurrentSession();

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

  const stage = await getStageForDocumentWorkflow(stageId, session.user.id, session.user.role);

  if (!stage) {
    return { error: "Stage introuvable ou non accessible." };
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
        statut: "DEPOSE",
        source: "UPLOADED",
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
        statut: createdDocument.statut,
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

  revalidatePath("/documents");
  revalidatePath(`/stagiaires/${stage.stagiaireId}`);
  redirect(getRedirectTarget(`/stagiaires/${stage.stagiaireId}`, "document-uploaded"));
}

export async function transitionDocumentWorkflowAction(
  _previousState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const session = await getCurrentSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = documentWorkflowSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Action documentaire invalide.",
    };
  }

  const data = parsedData.data;
  const document = await getDocumentForWorkflow(data.documentId);

  if (!document || document.isDeleted) {
    return {
      error: "Document introuvable.",
    };
  }

  const hasAccess = canAccessStageDocuments(session.user.role, {
    isStageOwner: document.stage.stagiaire.userId === session.user.id,
    isAssignedEncadrant: document.stage.encadrantId === session.user.id,
  });

  if (!hasAccess) {
    return {
      error: "Vous n avez pas acces a ce document.",
    };
  }

  try {
    if (data.intent === "submit") {
      if (!canSubmitDocumentForReview(document.statut)) {
        return {
          error: "Ce document ne peut pas etre envoye en verification dans son statut actuel.",
        };
      }

      await prisma.document.update({
        where: { id: document.id },
        data: {
          statut: "EN_VERIFICATION",
          validationRequestedAt: new Date(),
          rejectionReason: null,
          rejectedAt: null,
        },
      });

      await logAuditEvent({
        userId: session.user.id,
        action: "DOCUMENT_SUBMIT_FOR_REVIEW",
        entite: "Document",
        entiteId: document.id,
        ancienneValeur: {
          statut: document.statut,
        },
        nouvelleValeur: {
          statut: "EN_VERIFICATION",
          stageId: document.stageId,
        },
      });

      revalidatePath("/documents");
      revalidatePath(`/documents/${document.id}`);
      revalidatePath(`/stagiaires/${document.stage.stagiaireId}`);
      redirect(getRedirectTarget(`/documents/${document.id}`, "submitted"));
    }

    if (data.intent === "validate" || data.intent === "reject") {
      const canManage = canManageDocumentReview(session.user.role, {
        isAssignedEncadrant: document.stage.encadrantId === session.user.id,
      });

      if (!canManage) {
        return {
          error: "Vous ne pouvez pas valider ou rejeter ce document.",
        };
      }

      if (!canReviewDocument(document.statut)) {
        return {
          error: "Seuls les documents en verification peuvent etre traites.",
        };
      }

      const nextStatus = data.intent === "validate" ? "VALIDE" : "REJETE";

      await prisma.document.update({
        where: { id: document.id },
        data: {
          statut: nextStatus,
          reviewedByUserId: session.user.id,
          reviewedAt: new Date(),
          validatedAt: data.intent === "validate" ? new Date() : null,
          rejectedAt: data.intent === "reject" ? new Date() : null,
          rejectionReason: data.intent === "reject" ? data.commentaire : null,
        },
      });

      await logAuditEvent({
        userId: session.user.id,
        action: data.intent === "validate" ? "DOCUMENT_VALIDATE" : "DOCUMENT_REJECT",
        entite: "Document",
        entiteId: document.id,
        ancienneValeur: {
          statut: document.statut,
        },
        nouvelleValeur: {
          statut: nextStatus,
          rejectionReason: data.commentaire,
        },
      });

      if (data.intent === "reject") {
        const recipientIds = Array.from(
          new Set([document.stage.stagiaire.userId, document.auteurId].filter((value) => value !== session.user.id)),
        );

        if (recipientIds.length > 0) {
          await queueDocumentRejectedNotification({
            recipientIds,
            stageId: document.stageId,
            documentName: document.nom,
            documentId: document.id,
            triggeredByUserId: session.user.id,
          });
        }
      }

      revalidatePath("/documents");
      revalidatePath(`/documents/${document.id}`);
      revalidatePath(`/stagiaires/${document.stage.stagiaireId}`);
      redirect(
        getRedirectTarget(
          `/documents/${document.id}`,
          data.intent === "validate" ? "validated" : "rejected",
        ),
      );
    }

    if (data.intent === "prepare-signature" || data.intent === "mark-signed") {
      if (!canPrepareDocumentSignature(session.user.role)) {
        return {
          error: "La preparation de signature est reservee aux roles RH et ADMIN.",
        };
      }

      await prisma.document.update({
        where: { id: document.id },
        data: {
          signatureStatus: data.intent === "prepare-signature" ? "READY" : "SIGNED",
          signatureProvider: "manual-placeholder",
          signatureReference:
            data.intent === "prepare-signature"
              ? `sig-${randomUUID().slice(0, 8)}`
              : document.signatureReference ?? `sig-${randomUUID().slice(0, 8)}`,
          signaturePreparedAt:
            data.intent === "prepare-signature"
              ? new Date()
              : document.signaturePreparedAt ?? new Date(),
          signedAt: data.intent === "mark-signed" ? new Date() : null,
        },
      });

      await logAuditEvent({
        userId: session.user.id,
        action:
          data.intent === "prepare-signature"
            ? "DOCUMENT_SIGNATURE_PREPARE"
            : "DOCUMENT_SIGNATURE_MARK_SIGNED",
        entite: "Document",
        entiteId: document.id,
        nouvelleValeur: {
          signatureStatus: data.intent === "prepare-signature" ? "READY" : "SIGNED",
        },
      });

      revalidatePath("/documents");
      revalidatePath(`/documents/${document.id}`);
      redirect(
        getRedirectTarget(
          `/documents/${document.id}`,
          data.intent === "prepare-signature" ? "signature-prepared" : "signed",
        ),
      );
    }
  } catch (error) {
    console.error(error);

    return {
      error: "Transition documentaire impossible pour le moment.",
    };
  }

  return {
    error: "Action documentaire non prise en charge.",
  };
}

export async function requestPdfGenerationAction(
  _previousState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const session = await getCurrentSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = pdfGenerationRequestSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Demande PDF invalide.",
    };
  }

  const data = parsedData.data;
  const stage = await prisma.stage.findUnique({
    where: { id: data.stageId },
    include: {
      stagiaire: true,
    },
  });

  if (!stage) {
    return {
      error: "Stage introuvable.",
    };
  }

  const canGenerate = canRequestPdfGeneration(session.user.role, {
    isAssignedEncadrant: stage.encadrantId === session.user.id,
  });

  if (!canGenerate) {
    return {
      error: "Vous ne pouvez pas generer de PDF pour ce stage.",
    };
  }

  try {
    const jobId = await requestGeneration({
      stageId: stage.id,
      template: data.template,
      requestedByUserId: session.user.id,
    });

    await logAuditEvent({
      userId: session.user.id,
      action: "PDF_GENERATION_REQUEST",
      entite: "PdfGenerationJob",
      entiteId: jobId,
      nouvelleValeur: {
        stageId: stage.id,
        template: data.template,
        templateLabel: getPdfTemplateLabel(data.template),
      },
    });
  } catch (error) {
    console.error(error);

    return {
      error: "Generation PDF impossible pour le moment.",
    };
  }

  revalidatePath("/documents");
  revalidatePath(`/stagiaires/${stage.stagiaireId}`);
  redirect(getRedirectTarget("/documents", "generated"));
}
