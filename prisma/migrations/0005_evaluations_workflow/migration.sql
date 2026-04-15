ALTER TYPE "EvaluationType" ADD VALUE IF NOT EXISTS 'DEBUT_STAGE';

CREATE TYPE "EvaluationStatus" AS ENUM ('BROUILLON', 'SOUMIS', 'VALIDE', 'RETOURNE');
CREATE TYPE "EvaluationRevisionAction" AS ENUM ('CREATE', 'UPDATE_DRAFT', 'SUBMIT', 'VALIDATE', 'RETURN');

ALTER TABLE "Evaluation"
ADD COLUMN "status" "EvaluationStatus" NOT NULL DEFAULT 'BROUILLON',
ADD COLUMN "gridVersion" TEXT NOT NULL DEFAULT 'v1',
ADD COLUMN "criteriaSnapshot" JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN "totalScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "maxScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "commentaireEncadrant" TEXT,
ADD COLUMN "commentaireRh" TEXT,
ADD COLUMN "scheduledFor" TIMESTAMP(3),
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "validatedAt" TIMESTAMP(3),
ADD COLUMN "returnedAt" TIMESTAMP(3),
ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "submittedByUserId" TEXT,
ADD COLUMN "validatedByUserId" TEXT,
ADD COLUMN "returnedByUserId" TEXT;

CREATE TABLE "EvaluationRevision" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "action" "EvaluationRevisionAction" NOT NULL,
    "previousStatus" "EvaluationStatus",
    "nextStatus" "EvaluationStatus" NOT NULL,
    "previousNotes" JSONB,
    "nextNotes" JSONB NOT NULL,
    "previousScore" INTEGER,
    "nextScore" INTEGER NOT NULL,
    "commentSnapshot" JSONB,
    "changedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Evaluation_stageId_status_idx" ON "Evaluation"("stageId", "status");
CREATE INDEX "Evaluation_scheduledFor_idx" ON "Evaluation"("scheduledFor");
CREATE INDEX "EvaluationRevision_evaluationId_createdAt_idx" ON "EvaluationRevision"("evaluationId", "createdAt");
CREATE INDEX "EvaluationRevision_changedByUserId_createdAt_idx" ON "EvaluationRevision"("changedByUserId", "createdAt");

ALTER TABLE "EvaluationRevision"
ADD CONSTRAINT "EvaluationRevision_evaluationId_fkey"
FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
