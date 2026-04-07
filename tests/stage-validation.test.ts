import { describe, expect, it } from "vitest";
import { stageFormSchema } from "@/lib/validations/stage";

describe("stageFormSchema", () => {
  it("accepts a valid stage payload", () => {
    const result = stageFormSchema.safeParse({
      stagiaireId: "stagiaire-1",
      encadrantId: "encadrant-1",
      dateDebut: "2026-04-10",
      dateFin: "2026-06-30",
      departement: "Informatique",
      sujet: "Portail de gestion",
      githubRepo: "https://github.com/example/repo",
      statut: "EN_COURS",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a stage whose end date is before start date", () => {
    const result = stageFormSchema.safeParse({
      stagiaireId: "stagiaire-1",
      dateDebut: "2026-06-30",
      dateFin: "2026-04-10",
      departement: "Informatique",
      sujet: "Portail de gestion",
      statut: "PLANIFIE",
    });

    expect(result.success).toBe(false);
  });
});
