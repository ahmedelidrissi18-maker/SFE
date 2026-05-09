export const notificationEventDefinitions = [
  {
    type: "STAGIAIRE_CREATED",
    label: "Nouveau stagiaire",
    description: "Alerte lors de la creation d une nouvelle fiche stagiaire.",
  },
  {
    type: "RAPPORT_SUBMITTED",
    label: "Rapport soumis",
    description: "Alerte quand un rapport entre en revue.",
  },
  {
    type: "RAPPORT_RETURNED",
    label: "Rapport retourne",
    description: "Alerte quand un rapport est renvoye avec demande de corrections.",
  },
  {
    type: "STAGE_ENDING_SOON",
    label: "Fin de stage proche",
    description: "Alerte sur les stages qui approchent de leur date de fin.",
  },
  {
    type: "GITHUB_SYNC_SUCCESS",
    label: "Synchro GitHub terminee",
    description: "Alerte sur une synchronisation GitHub terminee avec succes.",
  },
  {
    type: "GITHUB_SYNC_FAILED",
    label: "Synchro GitHub echouee",
    description: "Alerte sur une synchronisation GitHub en erreur ou limitee.",
  },
  {
    type: "EVALUATION_SCHEDULED",
    label: "Evaluation planifiee",
    description: "Alerte quand une evaluation doit etre preparee ou tenir sa date.",
  },
  {
    type: "DOCUMENT_REJECTED",
    label: "Document rejete",
    description: "Alerte quand un document est refuse et demande une nouvelle action.",
  },
  {
    type: "RAPPORT_OVERDUE",
    label: "Rapport en retard",
    description: "Alerte sur les rapports attendus qui n ont pas encore ete soumis.",
  },
  {
    type: "EVALUATION_MISSING",
    label: "Evaluation manquante",
    description: "Alerte sur les evaluations attendues mais non encore planifiees ou creees.",
  },
  {
    type: "DOCUMENT_BLOCKED",
    label: "Document bloque",
    description: "Alerte sur les documents qui restent en verification trop longtemps.",
  },
] as const;

export type NotificationEventType = (typeof notificationEventDefinitions)[number]["type"];

export function getNotificationTypeLabel(type: string) {
  const labels: Record<string, string> = {
    STAGIAIRE_CREATED: "Nouveau stagiaire",
    RAPPORT_SUBMITTED: "Rapport soumis",
    RAPPORT_RETURNED: "Rapport retourne",
    STAGE_ENDING_SOON: "Fin de stage proche",
    GITHUB_SYNC_SUCCESS: "Synchro GitHub terminee",
    GITHUB_SYNC_FAILED: "Synchro GitHub echouee",
    EVALUATION_SCHEDULED: "Evaluation planifiee",
    DOCUMENT_REJECTED: "Document rejete",
    RAPPORT_OVERDUE: "Rapport en retard",
    EVALUATION_MISSING: "Evaluation manquante",
    DOCUMENT_BLOCKED: "Document bloque",
  };

  return labels[type] ?? "Notification";
}
