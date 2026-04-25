import type { StageStatus } from "@prisma/client";

export const ACTIVE_STAGE_STATUSES: StageStatus[] = ["PLANIFIE", "EN_COURS", "SUSPENDU"];

export function isActiveStageStatus(status: StageStatus) {
  return ACTIVE_STAGE_STATUSES.includes(status);
}

export function getStageStatusLabel(status: StageStatus) {
  const labels: Record<StageStatus, string> = {
    PLANIFIE: "Planifié",
    EN_COURS: "En cours",
    SUSPENDU: "Suspendu",
    TERMINE: "Terminé",
    ANNULE: "Annulé",
  };

  return labels[status];
}

export function hasActiveStageConflict(
  stages: Array<{ id: string; statut: StageStatus }>,
  nextStatus: StageStatus,
  currentStageId?: string,
) {
  if (!isActiveStageStatus(nextStatus)) {
    return false;
  }

  return stages.some(
    (stage) => stage.id !== currentStageId && isActiveStageStatus(stage.statut),
  );
}
