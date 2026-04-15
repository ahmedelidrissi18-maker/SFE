import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { DocumentSource, DocumentStatus, SignatureStatus, type DocumentType, type Prisma, type Role } from "@prisma/client";

const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

const documentTypeLabels: Record<DocumentType, string> = {
  CONVENTION: "Convention",
  ATTESTATION: "Attestation",
  FICHE_RECAPITULATIVE: "Fiche recapitulative",
  CIN: "CIN",
  CV: "CV",
  RAPPORT: "Rapport",
  JUSTIFICATIF: "Justificatif",
  RAPPORT_EVAL: "Rapport d evaluation",
  RAPPORT_CONSOLIDE: "Rapport consolide",
  AUTRE: "Autre",
};

const documentStatusLabels: Record<DocumentStatus, string> = {
  DEPOSE: "Depose",
  EN_VERIFICATION: "En verification",
  VALIDE: "Valide",
  REJETE: "Rejete",
};

const documentSourceLabels: Record<DocumentSource, string> = {
  UPLOADED: "Depot manuel",
  GENERATED: "Genere",
};

const signatureStatusLabels: Record<SignatureStatus, string> = {
  NOT_REQUESTED: "Non preparee",
  READY: "Pret a signer",
  SIGNED: "Signe",
  FAILED: "Echec signature",
};

export const pdfTemplateDefinitions = [
  {
    key: "ATTESTATION_STAGE",
    label: "Attestation",
    documentType: "ATTESTATION" as const,
  },
  {
    key: "FICHE_RECAP_STAGE",
    label: "Fiche recapitulative",
    documentType: "FICHE_RECAPITULATIVE" as const,
  },
  {
    key: "RAPPORT_CONSOLIDE_STAGE",
    label: "Rapport consolide",
    documentType: "RAPPORT_CONSOLIDE" as const,
  },
] as const;

export type PdfTemplateKey = (typeof pdfTemplateDefinitions)[number]["key"];

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function getDocumentTypeLabel(type: DocumentType) {
  return documentTypeLabels[type];
}

export function getDocumentStatusLabel(status: DocumentStatus) {
  return documentStatusLabels[status];
}

export function getDocumentSourceLabel(source: DocumentSource) {
  return documentSourceLabels[source];
}

export function getSignatureStatusLabel(status: SignatureStatus) {
  return signatureStatusLabels[status];
}

export function getPdfTemplateLabel(template: PdfTemplateKey) {
  return (
    pdfTemplateDefinitions.find((definition) => definition.key === template)?.label ??
    "Generation PDF"
  );
}

export function getPdfTemplateDocumentType(template: PdfTemplateKey): DocumentType {
  return (
    pdfTemplateDefinitions.find((definition) => definition.key === template)?.documentType ??
    "AUTRE"
  );
}

export function formatDocumentSize(size: number) {
  if (size < 1024) {
    return `${size} o`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} Ko`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

export function getDocumentStorageRoot() {
  return path.join(process.cwd(), "storage", "documents");
}

export function sanitizeDocumentFilename(filename: string) {
  const normalized = filename.normalize("NFKD").replace(/[^\x00-\x7F]/g, "");
  const safe = normalized.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return safe.replace(/^-|-$/g, "") || `document-${randomUUID()}.bin`;
}

export function buildStoredDocumentName(filename: string) {
  const extension = path.extname(filename);
  const baseName = path.basename(filename, extension);
  const fingerprint = createHash("sha1").update(`${filename}-${Date.now()}-${randomUUID()}`).digest("hex").slice(0, 12);
  const safeBaseName = sanitizeDocumentFilename(baseName).slice(0, 40) || "document";

  return `${safeBaseName}-${fingerprint}${extension}`;
}

export function validateDocumentUpload(file: File | null | undefined) {
  if (!file || file.size === 0) {
    return "Le fichier est obligatoire.";
  }

  if (!allowedMimeTypes.has(file.type)) {
    return "Format non autorise. Utilisez PDF, JPG, PNG, DOC ou DOCX.";
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return "Le fichier depasse la taille maximale de 5 Mo.";
  }

  return null;
}

export function getDocumentDownloadName(originalName: string, version: number) {
  if (version <= 1) {
    return originalName;
  }

  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  return `${baseName}-v${version}${extension}`;
}

export function getDocumentContentType(filename: string) {
  const extension = path.extname(filename).toLowerCase();

  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
}

export function canAccessStageDocuments(role: Role, options: { isStageOwner: boolean; isAssignedEncadrant: boolean }) {
  if (role === "ADMIN" || role === "RH") {
    return true;
  }

  if (role === "ENCADRANT") {
    return options.isAssignedEncadrant;
  }

  if (role === "STAGIAIRE") {
    return options.isStageOwner;
  }

  return false;
}

export function canManageDocumentReview(
  role: Role,
  options: { isAssignedEncadrant: boolean },
) {
  if (role === "ADMIN" || role === "RH") {
    return true;
  }

  return role === "ENCADRANT" && options.isAssignedEncadrant;
}

export function canRequestPdfGeneration(
  role: Role,
  options: { isAssignedEncadrant: boolean },
) {
  if (role === "ADMIN" || role === "RH") {
    return true;
  }

  return role === "ENCADRANT" && options.isAssignedEncadrant;
}

export function canPrepareDocumentSignature(role: Role) {
  return role === "ADMIN" || role === "RH";
}

export function getDocumentVisibilityFilter(role: Role, userId: string): Prisma.DocumentWhereInput {
  if (role === "ENCADRANT") {
    return {
      stage: {
        encadrantId: userId,
      },
    };
  }

  if (role === "STAGIAIRE") {
    return {
      stage: {
        stagiaire: {
          userId,
        },
      },
    };
  }

  return {};
}

export function canEditDocument(status: DocumentStatus) {
  return status === "DEPOSE" || status === "REJETE";
}

export function canSubmitDocumentForReview(status: DocumentStatus) {
  return status === "DEPOSE" || status === "REJETE";
}

export function canReviewDocument(status: DocumentStatus) {
  return status === "EN_VERIFICATION";
}

export function isSensitiveDocumentType(type: DocumentType) {
  return new Set<DocumentType>([
    "CONVENTION",
    "ATTESTATION",
    "CIN",
    "RAPPORT_EVAL",
    "FICHE_RECAPITULATIVE",
    "RAPPORT_CONSOLIDE",
  ]).has(type);
}

export function shouldAuditDocumentDownload(type: DocumentType) {
  return isSensitiveDocumentType(type);
}

export { MAX_DOCUMENT_SIZE_BYTES };
