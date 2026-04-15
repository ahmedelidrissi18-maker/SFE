import {
  EvaluationStatus,
  EvaluationType,
  type Prisma,
  type Role,
} from "@prisma/client";

export type EvaluationCriterionDefinition = {
  id: string;
  label: string;
  description: string;
  maxScore: number;
};

export type EvaluationGridDefinition = {
  version: string;
  type: EvaluationType;
  label: string;
  description: string;
  criteria: EvaluationCriterionDefinition[];
};

export type EvaluationNoteEntry = {
  criterionId: string;
  score: number;
  comment?: string;
};

export const evaluationGridDefinitions: Record<EvaluationType, EvaluationGridDefinition> = {
  DEBUT_STAGE: {
    version: "v1",
    type: EvaluationType.DEBUT_STAGE,
    label: "Debut de stage",
    description: "Verifier l integration, la comprehension du contexte et l autonomie initiale.",
    criteria: [
      {
        id: "integration",
        label: "Integration dans l equipe",
        description: "Qualite du demarrage, communication et appropriation du cadre de travail.",
        maxScore: 5,
      },
      {
        id: "comprehension",
        label: "Compréhension du sujet",
        description: "Capacite a reformuler les objectifs, les contraintes et le resultat attendu.",
        maxScore: 5,
      },
      {
        id: "organisation",
        label: "Organisation",
        description: "Ponctualite, clarte des priorites et gestion du rythme de travail.",
        maxScore: 5,
      },
      {
        id: "initiative",
        label: "Initiative initiale",
        description: "Capacite a poser les bonnes questions et proposer un premier plan d action.",
        maxScore: 5,
      },
    ],
  },
  MI_PARCOURS: {
    version: "v1",
    type: EvaluationType.MI_PARCOURS,
    label: "Mi-parcours",
    description: "Mesurer la progression technique, la collaboration et la qualite d execution a mi-stage.",
    criteria: [
      {
        id: "progression-technique",
        label: "Progression technique",
        description: "Montee en competence sur les outils, pratiques et standards de l equipe.",
        maxScore: 5,
      },
      {
        id: "qualite-livrables",
        label: "Qualite des livrables",
        description: "Fiabilite, lisibilite et pertinence du travail remis ou presente.",
        maxScore: 5,
      },
      {
        id: "collaboration",
        label: "Collaboration",
        description: "Participation aux echanges, prise en compte des retours et coordination.",
        maxScore: 5,
      },
      {
        id: "autonomie",
        label: "Autonomie",
        description: "Capacite a avancer avec moins d encadrement tout en sachant escalader.",
        maxScore: 5,
      },
    ],
  },
  FINAL: {
    version: "v1",
    type: EvaluationType.FINAL,
    label: "Fin de stage",
    description: "Synthese finale sur l impact, la progression et la preparation a la suite.",
    criteria: [
      {
        id: "objectifs",
        label: "Atteinte des objectifs",
        description: "Niveau de realisation des objectifs fixes au debut du stage.",
        maxScore: 5,
      },
      {
        id: "impact",
        label: "Impact du travail",
        description: "Valeur apportee au projet, a l equipe ou aux processus.",
        maxScore: 5,
      },
      {
        id: "professionnalisme",
        label: "Professionnalisme",
        description: "Fiabilite, posture, communication et respect des engagements.",
        maxScore: 5,
      },
      {
        id: "projection",
        label: "Projection",
        description: "Capacite a capitaliser sur le stage et a preparer l apres-stage.",
        maxScore: 5,
      },
    ],
  },
};

export function getEvaluationGridDefinition(type: EvaluationType) {
  return evaluationGridDefinitions[type];
}

export function getEvaluationTypeLabel(type: EvaluationType) {
  return getEvaluationGridDefinition(type).label;
}

export function getEvaluationStatusLabel(status: EvaluationStatus) {
  const labels: Record<EvaluationStatus, string> = {
    BROUILLON: "Brouillon",
    SOUMIS: "Soumis",
    VALIDE: "Valide",
    RETOURNE: "Retourne",
  };

  return labels[status];
}

export function getEvaluationTypeOptions() {
  return Object.values(EvaluationType).map((type) => ({
    value: type,
    label: getEvaluationTypeLabel(type),
  }));
}

export function buildDefaultEvaluationNotes(
  typeOrCriteria: EvaluationType | EvaluationCriterionDefinition[],
) {
  const criteria = Array.isArray(typeOrCriteria)
    ? typeOrCriteria
    : getEvaluationGridDefinition(typeOrCriteria).criteria;

  return criteria.map((criterion) => ({
    criterionId: criterion.id,
    score: 0,
    comment: "",
  }));
}

export function normalizeEvaluationCriteriaSnapshot(
  rawSnapshot: unknown,
  fallbackType?: EvaluationType,
) {
  const fallbackCriteria = fallbackType
    ? getEvaluationGridDefinition(fallbackType).criteria
    : ([] as EvaluationCriterionDefinition[]);

  if (!Array.isArray(rawSnapshot)) {
    return fallbackCriteria;
  }

  const normalizedSnapshot = rawSnapshot
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const criterion = entry as Record<string, unknown>;
      const id = typeof criterion.id === "string" ? criterion.id.trim() : "";
      const label = typeof criterion.label === "string" ? criterion.label.trim() : "";
      const description =
        typeof criterion.description === "string" ? criterion.description.trim() : "";
      const maxScore =
        typeof criterion.maxScore === "number" && Number.isFinite(criterion.maxScore)
          ? Math.max(1, Math.round(criterion.maxScore))
          : 0;

      if (!id || !label || !description || maxScore <= 0) {
        return null;
      }

      return {
        id,
        label,
        description,
        maxScore,
      };
    })
    .filter((criterion): criterion is EvaluationCriterionDefinition => Boolean(criterion));

  return normalizedSnapshot.length > 0 ? normalizedSnapshot : fallbackCriteria;
}

export function normalizeEvaluationNotes(
  rawNotes: unknown,
  criteria: EvaluationCriterionDefinition[],
) {
  const rawEntries = Array.isArray(rawNotes) ? rawNotes : [];
  const rawByCriterionId = new Map<string, Record<string, unknown>>();

  for (const entry of rawEntries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const noteEntry = entry as Record<string, unknown>;
    const criterionId =
      typeof noteEntry.criterionId === "string" ? noteEntry.criterionId.trim() : "";

    if (criterionId) {
      rawByCriterionId.set(criterionId, noteEntry);
    }
  }

  return criteria.map((criterion) => {
    const matchingEntry = rawByCriterionId.get(criterion.id);
    const rawScore = matchingEntry?.score;
    const score =
      typeof rawScore === "number" && Number.isFinite(rawScore)
        ? rawScore
        : typeof rawScore === "string" && rawScore.trim() !== ""
          ? Number(rawScore)
          : 0;
    const rawComment = matchingEntry?.comment;
    const comment =
      typeof rawComment === "string" && rawComment.trim().length > 0
        ? rawComment.trim()
        : undefined;

    return {
      criterionId: criterion.id,
      score: Math.min(criterion.maxScore, Math.max(0, Math.round(score || 0))),
      comment,
    };
  });
}

export function calculateEvaluationScore(
  criteria: EvaluationCriterionDefinition[],
  rawNotes: unknown,
) {
  const normalizedNotes = normalizeEvaluationNotes(rawNotes, criteria);
  const totalScore = normalizedNotes.reduce((sum, entry) => sum + entry.score, 0);
  const maxScore = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);
  const completionRate = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    notes: normalizedNotes,
    totalScore,
    maxScore,
    completionRate,
  };
}

export function canEditEvaluation(status: EvaluationStatus) {
  return status === EvaluationStatus.BROUILLON || status === EvaluationStatus.RETOURNE;
}

export function canSubmitEvaluation(status: EvaluationStatus) {
  return canEditEvaluation(status);
}

export function canReviewEvaluation(status: EvaluationStatus) {
  return status === EvaluationStatus.SOUMIS;
}

export function isEvaluationReviewerRole(role: Role) {
  return role === "ADMIN" || role === "RH";
}

export function isEvaluationEditorRole(role: Role) {
  return role === "ADMIN" || role === "RH" || role === "ENCADRANT";
}

export function canManageEvaluationForStage(
  role: Role,
  ownership: {
    isAssignedEncadrant: boolean;
  },
) {
  if (role === "ADMIN" || role === "RH") {
    return true;
  }

  return role === "ENCADRANT" && ownership.isAssignedEncadrant;
}

export function canViewEvaluationForStage(
  role: Role,
  ownership: {
    isAssignedEncadrant: boolean;
    isStageOwner: boolean;
  },
) {
  if (role === "ADMIN" || role === "RH") {
    return true;
  }

  if (role === "ENCADRANT") {
    return ownership.isAssignedEncadrant;
  }

  return role === "STAGIAIRE" && ownership.isStageOwner;
}

export function getEvaluationVisibilityFilter(role: Role, userId: string): Prisma.EvaluationWhereInput {
  if (role === "ENCADRANT") {
    return {
      stage: {
        encadrantId: userId,
      },
    };
  }

  if (role === "STAGIAIRE") {
    return {
      stage: {
        stagiaire: {
          userId,
        },
      },
    };
  }

  return {};
}

export function getEvaluationRevisionActionLabel(action: string) {
  const labels: Record<string, string> = {
    CREATE: "Creation",
    UPDATE_DRAFT: "Mise a jour",
    SUBMIT: "Soumission",
    VALIDATE: "Validation",
    RETURN: "Retour",
  };

  return labels[action] ?? "Mise a jour";
}
