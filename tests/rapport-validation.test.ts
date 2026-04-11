import { describe, expect, it } from "vitest";
import { rapportFormSchema, rapportReviewSchema } from "@/lib/validations/rapport";

describe("rapport validation", () => {
  it("accepts a valid report payload", () => {
    const result = rapportFormSchema.safeParse({
      stageId: "stage-1",
      semaine: 3,
      tachesRealisees: "Analyse, corrections et preparation du module rapports.",
      difficultes: "Aucune difficulte bloquante.",
      planSuivant: "Soumettre le rapport pour revue.",
      avancement: 60,
      intent: "submit",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid week", () => {
    const result = rapportFormSchema.safeParse({
      stageId: "stage-1",
      semaine: 0,
      tachesRealisees: "Texte suffisamment long pour passer.",
      avancement: 30,
      intent: "draft",
    });

    expect(result.success).toBe(false);
  });

  it("requires a comment when returning a report", () => {
    const result = rapportReviewSchema.safeParse({
      rapportId: "rapport-1",
      intent: "return",
      commentaireEncadrant: "",
    });

    expect(result.success).toBe(false);
  });
});
