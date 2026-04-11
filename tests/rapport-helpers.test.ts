import { describe, expect, it } from "vitest";
import {
  canEditRapport,
  canReviewRapport,
  getRapportStatusLabel,
  getSuggestedRapportWeek,
} from "@/lib/rapports";

describe("rapports helpers", () => {
  it("returns display labels", () => {
    expect(getRapportStatusLabel("BROUILLON")).toBe("Brouillon");
    expect(getRapportStatusLabel("SOUMIS")).toBe("Soumis");
  });

  it("detects editable and reviewable statuses", () => {
    expect(canEditRapport("BROUILLON")).toBe(true);
    expect(canEditRapport("RETOURNE")).toBe(true);
    expect(canEditRapport("SOUMIS")).toBe(false);
    expect(canReviewRapport("SOUMIS")).toBe(true);
    expect(canReviewRapport("VALIDE")).toBe(false);
  });

  it("suggests the next week number", () => {
    expect(
      getSuggestedRapportWeek(
        new Date("2026-04-01T00:00:00.000Z"),
        [1, 2, 3],
        new Date("2026-04-20T00:00:00.000Z"),
      ),
    ).toBe(4);

    expect(
      getSuggestedRapportWeek(
        new Date("2026-04-01T00:00:00.000Z"),
        [],
        new Date("2026-04-02T00:00:00.000Z"),
      ),
    ).toBe(1);
  });
});
