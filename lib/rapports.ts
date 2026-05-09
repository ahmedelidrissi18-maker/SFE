import { RapportStatus } from "@prisma/client";

const editableStatuses: RapportStatus[] = ["BROUILLON", "RETOURNE"];

export function getRapportStatusLabel(status: RapportStatus) {
  const labels: Record<RapportStatus, string> = {
    BROUILLON: "Brouillon",
    SOUMIS: "Soumis",
    VALIDE: "Validé",
    RETOURNE: "Retourné",
  };

  return labels[status];
}

export function resolveRapportStatus(value?: string | null) {
  const normalizedValue = value?.trim().toUpperCase();

  if (!normalizedValue || !(normalizedValue in RapportStatus)) {
    return null;
  }

  return normalizedValue as RapportStatus;
}

export function canEditRapport(status: RapportStatus) {
  return editableStatuses.includes(status);
}

export function canReviewRapport(status: RapportStatus) {
  return status === "SOUMIS";
}

export function getSuggestedRapportWeek(
  stageStartDate: Date,
  existingWeeks: number[] = [],
  referenceDate = new Date(),
) {
  if (existingWeeks.length > 0) {
    return Math.max(...existingWeeks) + 1;
  }

  const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diff = referenceDate.getTime() - stageStartDate.getTime();

  return Math.max(1, Math.floor(diff / millisecondsPerWeek) + 1);
}
