import { describe, expect, it } from "vitest";
import {
  evaluationFormSchema,
  evaluationReviewSchema,
} from "@/lib/validations/evaluation";

describe("evaluation validation", () => {
  it("accepte une evaluation brouillon valide", () => {
    const result = evaluationFormSchema.safeParse({
      stageId: "stage-1",
      type: "MI_PARCOURS",
      scheduledFor: "2026-04-20",
      commentaire: "Bonne progression globale.",
      commentaireEncadrant: "A consolider sur les tests.",
      notesJson: JSON.stringify([
        {
          criterionId: "progression-technique",
          score: 4,
          comment: "Bonne montee en competence.",
        },
      ]),
      intent: "draft",
    });

    expect(result.success).toBe(true);
  });

  it("refuse une grille vide", () => {
    const result = evaluationFormSchema.safeParse({
      stageId: "stage-1",
      type: "FINAL",
      notesJson: JSON.stringify([]),
      intent: "submit",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("La grille d evaluation est vide.");
  });

  it("exige un commentaire RH pour retourner une evaluation", () => {
    const result = evaluationReviewSchema.safeParse({
      evaluationId: "evaluation-1",
      commentaireRh: "",
      intent: "return",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Un commentaire RH est obligatoire pour retourner une evaluation.",
    );
  });
});
