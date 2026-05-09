import { StageStatus } from "@prisma/client";

export const ACTIVE_STAGE_STATUSES: StageStatus[] = ["PLANIFIE", "EN_COURS", "SUSPENDU"];

export function isActiveStageStatus(status: StageStatus) {
  return ACTIVE_STAGE_STATUSES.includes(status);
}

export function getStageStatusLabel(status: StageStatus) {
  const labels: Record<StageStatus, string> = {
    PLANIFIE: "PlanifiÃ©",
    EN_COURS: "En cours",
    SUSPENDU: "Suspendu",
    TERMINE: "TerminÃ©",
    ANNULE: "AnnulÃ©",
  };

  return labels[status];
}

export function resolveStageStatus(value?: string | null) {
  const normalizedValue = value?.trim().toUpperCase();

  if (!normalizedValue || !(normalizedValue in StageStatus)) {
    return null;
  }

  return normalizedValue as StageStatus;
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
