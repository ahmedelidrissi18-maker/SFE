ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'FICHE_RECAPITULATIVE';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'RAPPORT_CONSOLIDE';

CREATE TYPE "DocumentStatus" AS ENUM ('DEPOSE', 'EN_VERIFICATION', 'VALIDE', 'REJETE');
CREATE TYPE "DocumentSource" AS ENUM ('UPLOADED', 'GENERATED');
CREATE TYPE "SignatureStatus" AS ENUM ('NOT_REQUESTED', 'READY', 'SIGNED', 'FAILED');
CREATE TYPE "PdfGenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

ALTER TABLE "Document"
ADD COLUMN "statut" "DocumentStatus" NOT NULL DEFAULT 'DEPOSE',
ADD COLUMN "source" "DocumentSource" NOT NULL DEFAULT 'UPLOADED',
ADD COLUMN "generatedTemplate" TEXT,
ADD COLUMN "validationRequestedAt" TIMESTAMP(3),
ADD COLUMN "reviewedByUserId" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "validatedAt" TIMESTAMP(3),
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "signatureStatus" "SignatureStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
ADD COLUMN "signatureProvider" TEXT,
ADD COLUMN "signatureReference" TEXT,
ADD COLUMN "signaturePreparedAt" TIMESTAMP(3),
ADD COLUMN "signedAt" TIMESTAMP(3);

CREATE TABLE "PdfGenerationJob" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "PdfGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "outputDocumentId" TEXT,
    "payload" JSONB,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdfGenerationJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Document_stageId_statut_idx" ON "Document"("stageId", "statut");
CREATE INDEX "Document_stageId_type_idx" ON "Document"("stageId", "type");
CREATE INDEX "Document_source_generatedTemplate_idx" ON "Document"("source", "generatedTemplate");
CREATE INDEX "PdfGenerationJob_status_createdAt_idx" ON "PdfGenerationJob"("status", "createdAt");
CREATE INDEX "PdfGenerationJob_stageId_template_idx" ON "PdfGenerationJob"("stageId", "template");

ALTER TABLE "PdfGenerationJob"
ADD CONSTRAINT "PdfGenerationJob_stageId_fkey"
FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PdfGenerationJob"
ADD CONSTRAINT "PdfGenerationJob_outputDocumentId_fkey"
FOREIGN KEY ("outputDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
