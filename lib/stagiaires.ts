import type { StageStatus } from "@prisma/client";
import { formatDateFr } from "@/lib/date";

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
    PLANIFIE: "Planifié",
    EN_COURS: "En cours",
    SUSPENDU: "Suspendu",
    TERMINE: "Terminé",
    ANNULE: "Annulé",
  };

  return status ? labels[status] : "Aucun stage";
}

export function getAccountStatusLabel(isActive: boolean) {
  return isActive ? "Actif" : "Archivé";
}

export function getLatestStageInfo(stage: StageLike) {
  if (!stage) {
    return {
      departement: "Non affecté",
      statut: "Aucun stage",
      encadrant: "Non affecté",
    };
  }

  return {
    departement: stage.departement,
    statut: getStageStatusLabel(stage.statut),
    encadrant: stage.encadrant
      ? `${stage.encadrant.prenom} ${stage.encadrant.nom}`.trim()
      : "Non affecté",
  };
}

export function formatDate(date?: Date | null) {
  if (!date) {
    return "Non renseignée";
  }

  return formatDateFr(date);
}
