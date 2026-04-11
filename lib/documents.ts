import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import type { DocumentType, Role } from "@prisma/client";

const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

const documentTypeLabels: Record<DocumentType, string> = {
  CONVENTION: "Convention",
  ATTESTATION: "Attestation",
  CIN: "CIN",
  CV: "CV",
  RAPPORT: "Rapport",
  JUSTIFICATIF: "Justificatif",
  RAPPORT_EVAL: "Rapport d evaluation",
  AUTRE: "Autre",
};

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

export { MAX_DOCUMENT_SIZE_BYTES };
