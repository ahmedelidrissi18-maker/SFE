import type { StageStatus } from "@prisma/client";

type StageLike = {
  statut: StageStatus;
  departement: string;
  encadrant?: {
    nom: string;
    prenom: string;
  } | null;
} | null;

export function getStageStatusLabel(status?: StageStatus | null) {
  const labels: Record<StageStatus, string> = {
    PLANIFIE: "Planifie",
    EN_COURS: "En cours",
    SUSPENDU: "Suspendu",
    TERMINE: "Termine",
    ANNULE: "Annule",
  };

  return status ? labels[status] : "Aucun stage";
}

export function getAccountStatusLabel(isActive: boolean) {
  return isActive ? "Actif" : "Archive";
}

export function getLatestStageInfo(stage: StageLike) {
  if (!stage) {
    return {
      departement: "Non affecte",
      statut: "Aucun stage",
      encadrant: "Non affecte",
    };
  }

  return {
    departement: stage.departement,
    statut: getStageStatusLabel(stage.statut),
    encadrant: stage.encadrant
      ? `${stage.encadrant.prenom} ${stage.encadrant.nom}`.trim()
      : "Non affecte",
  };
}

export function formatDate(date?: Date | null) {
  if (!date) {
    return "Non renseignee";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
