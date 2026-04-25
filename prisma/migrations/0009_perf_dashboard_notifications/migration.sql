CREATE INDEX "User_role_isActive_idx"
ON "User"("role", "isActive");

CREATE INDEX "Stage_statut_dateFin_idx"
ON "Stage"("statut", "dateFin");
