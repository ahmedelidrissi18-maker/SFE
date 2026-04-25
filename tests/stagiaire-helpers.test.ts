import { describe, expect, it } from "vitest";
import { formatDate, getAccountStatusLabel, getLatestStageInfo, getStageStatusLabel } from "@/lib/stagiaires";

describe("stagiaires helpers", () => {
  it("returns the correct stage status label", () => {
    expect(getStageStatusLabel("EN_COURS")).toBe("En cours");
    expect(getStageStatusLabel("PLANIFIE")).toBe("Planifié");
  });

  it("returns fallback data when no stage exists", () => {
    expect(getLatestStageInfo(null)).toEqual({
      departement: "Non affecté",
      statut: "Aucun stage",
      encadrant: "Non affecté",
    });
  });

  it("returns account label based on active state", () => {
    expect(getAccountStatusLabel(true)).toBe("Actif");
    expect(getAccountStatusLabel(false)).toBe("Archivé");
  });

  it("formats dates for display", () => {
    expect(formatDate(new Date("2026-04-06T00:00:00.000Z"))).toBe("6 avril 2026");
    expect(formatDate(undefined)).toBe("Non renseignée");
  });
});
