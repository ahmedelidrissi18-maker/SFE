import { EvaluationStatus, EvaluationType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  calculateEvaluationScore,
  canEditEvaluation,
  canManageEvaluationForStage,
  canReviewEvaluation,
  getEvaluationGridDefinition,
  getEvaluationStatusLabel,
  getEvaluationTypeLabel,
} from "@/lib/evaluations";

describe("evaluation helpers", () => {
  it("retourne les libelles de type et de statut", () => {
    expect(getEvaluationTypeLabel(EvaluationType.DEBUT_STAGE)).toBe("Debut de stage");
    expect(getEvaluationTypeLabel(EvaluationType.FINAL)).toBe("Fin de stage");
    expect(getEvaluationStatusLabel(EvaluationStatus.SOUMIS)).toBe("Soumis");
    expect(getEvaluationStatusLabel(EvaluationStatus.RETOURNE)).toBe("Retourne");
  });

  it("calcule un score total normalise sur une grille", () => {
    const grid = getEvaluationGridDefinition(EvaluationType.MI_PARCOURS);
    const result = calculateEvaluationScore(grid.criteria, [
      {
        criterionId: "progression-technique",
        score: 4,
      },
      {
        criterionId: "qualite-livrables",
        score: 6,
      },
      {
        criterionId: "collaboration",
        score: -2,
      },
    ]);

    expect(result.totalScore).toBe(9);
    expect(result.maxScore).toBe(20);
    expect(result.completionRate).toBe(45);
  });

  it("bloque ou autorise les transitions de workflow attendues", () => {
    expect(canEditEvaluation(EvaluationStatus.BROUILLON)).toBe(true);
    expect(canEditEvaluation(EvaluationStatus.RETOURNE)).toBe(true);
    expect(canEditEvaluation(EvaluationStatus.SOUMIS)).toBe(false);
    expect(canReviewEvaluation(EvaluationStatus.SOUMIS)).toBe(true);
    expect(canReviewEvaluation(EvaluationStatus.VALIDE)).toBe(false);
  });

  it("verifie les droits d edition selon le role et le rattachement au stage", () => {
    expect(
      canManageEvaluationForStage("ENCADRANT", {
        isAssignedEncadrant: true,
      }),
    ).toBe(true);
    expect(
      canManageEvaluationForStage("ENCADRANT", {
        isAssignedEncadrant: false,
      }),
    ).toBe(false);
    expect(
      canManageEvaluationForStage("RH", {
        isAssignedEncadrant: false,
      }),
    ).toBe(true);
  });
});
