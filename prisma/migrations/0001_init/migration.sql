-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RH', 'ENCADRANT', 'STAGIAIRE');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('PLANIFIE', 'EN_COURS', 'SUSPENDU', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "RapportStatus" AS ENUM ('BROUILLON', 'SOUMIS', 'VALIDE', 'RETOURNE');

-- CreateEnum
CREATE TYPE "EvaluationType" AS ENUM ('MI_PARCOURS', 'FINAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONVENTION', 'ATTESTATION', 'CV', 'RAPPORT_EVAL', 'AUTRE');

-- CreateEnum
CREATE TYPE "PresenceStatus" AS ENUM ('PRESENT', 'ABSENT', 'JUSTIFIE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stagiaire" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cin" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "telephone" TEXT,
    "etablissement" TEXT,
    "specialite" TEXT,
    "niveau" TEXT,
    "annee" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stagiaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "stagiaireId" TEXT NOT NULL,
    "encadrantId" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "departement" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "githubRepo" TEXT,
    "statut" "StageStatus" NOT NULL DEFAULT 'PLANIFIE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rapport" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "semaine" INTEGER NOT NULL,
    "tachesRealisees" TEXT NOT NULL,
    "difficultes" TEXT,
    "planSuivant" TEXT,
    "avancement" INTEGER NOT NULL,
    "statut" "RapportStatus" NOT NULL DEFAULT 'BROUILLON',
    "dateSoumission" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rapport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "type" "EvaluationType" NOT NULL,
    "notes" JSONB NOT NULL,
    "commentaire" TEXT,
    "signature" TEXT,
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tailleOctets" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "destinataireId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lien" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "ancienneValeur" JSONB,
    "nouvelleValeur" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presence" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "statut" "PresenceStatus" NOT NULL,
    "justificatifUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Stagiaire_userId_key" ON "Stagiaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Stagiaire_cin_key" ON "Stagiaire"("cin");

-- CreateIndex
CREATE INDEX "Stage_stagiaireId_idx" ON "Stage"("stagiaireId");

-- CreateIndex
CREATE INDEX "Stage_encadrantId_idx" ON "Stage"("encadrantId");

-- CreateIndex
CREATE INDEX "Stage_statut_idx" ON "Stage"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Rapport_stageId_semaine_key" ON "Rapport"("stageId", "semaine");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_stageId_type_key" ON "Evaluation"("stageId", "type");

-- CreateIndex
CREATE INDEX "Notification_destinataireId_isRead_idx" ON "Notification"("destinataireId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entite_entiteId_idx" ON "AuditLog"("entite", "entiteId");

-- CreateIndex
CREATE UNIQUE INDEX "Presence_stageId_date_key" ON "Presence"("stageId", "date");

-- AddForeignKey
ALTER TABLE "Stagiaire" ADD CONSTRAINT "Stagiaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_stagiaireId_fkey" FOREIGN KEY ("stagiaireId") REFERENCES "Stagiaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_encadrantId_fkey" FOREIGN KEY ("encadrantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rapport" ADD CONSTRAINT "Rapport_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

