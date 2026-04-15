CREATE INDEX "Stage_statut_dateDebut_dateFin_idx"
ON "Stage"("statut", "dateDebut", "dateFin");

CREATE INDEX "Stage_encadrantId_statut_dateFin_idx"
ON "Stage"("encadrantId", "statut", "dateFin");

CREATE INDEX "Rapport_stageId_statut_idx"
ON "Rapport"("stageId", "statut");

CREATE INDEX "Rapport_stageId_updatedAt_idx"
ON "Rapport"("stageId", "updatedAt");

CREATE INDEX "Rapport_statut_dateSoumission_idx"
ON "Rapport"("statut", "dateSoumission");

CREATE INDEX "Document_stageId_isDeleted_statut_idx"
ON "Document"("stageId", "isDeleted", "statut");

CREATE INDEX "Document_statut_validatedAt_idx"
ON "Document"("statut", "validatedAt");
