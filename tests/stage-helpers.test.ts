import { describe, expect, it } from "vitest";
import { getStageStatusLabel, hasActiveStageConflict, isActiveStageStatus } from "@/lib/stages";

describe("stages helpers", () => {
  it("identifies active statuses", () => {
    expect(isActiveStageStatus("PLANIFIE")).toBe(true);
    expect(isActiveStageStatus("EN_COURS")).toBe(true);
    expect(isActiveStageStatus("SUSPENDU")).toBe(true);
    expect(isActiveStageStatus("TERMINE")).toBe(false);
    expect(isActiveStageStatus("ANNULE")).toBe(false);
  });

  it("detects active stage conflicts", () => {
    const stages = [
      { id: "1", statut: "EN_COURS" as const },
      { id: "2", statut: "TERMINE" as const },
    ];

    expect(hasActiveStageConflict(stages, "PLANIFIE")).toBe(true);
    expect(hasActiveStageConflict(stages, "TERMINE")).toBe(false);
    expect(hasActiveStageConflict(stages, "EN_COURS", "1")).toBe(false);
  });

  it("returns display labels", () => {
    expect(getStageStatusLabel("PLANIFIE")).toBe("Planifie");
    expect(getStageStatusLabel("ANNULE")).toBe("Annule");
  });
});
