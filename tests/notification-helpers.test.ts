import { EvaluationType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  getNotificationTypeLabel,
  notificationEventDefinitions,
} from "@/lib/notification-definitions";
import {
  getExpectedRapportWeekForAlerts,
  resolveMissingEvaluationTypeForAlerts,
} from "@/lib/notifications";

describe("notification helpers", () => {
  it("returns a label for known notification types", () => {
    expect(getNotificationTypeLabel("STAGIAIRE_CREATED")).toBe("Nouveau stagiaire");
    expect(getNotificationTypeLabel("RAPPORT_RETURNED")).toBe("Rapport retourne");
    expect(getNotificationTypeLabel("GITHUB_SYNC_SUCCESS")).toBe("Synchro GitHub terminee");
    expect(getNotificationTypeLabel("RAPPORT_OVERDUE")).toBe("Rapport en retard");
  });

  it("falls back to a generic label", () => {
    expect(getNotificationTypeLabel("UNKNOWN_TYPE")).toBe("Notification");
  });

  it("exposes the configurable event definitions", () => {
    expect(notificationEventDefinitions.some((item) => item.type === "GITHUB_SYNC_FAILED")).toBe(
      true,
    );
    expect(notificationEventDefinitions.length).toBeGreaterThanOrEqual(6);
  });

  it("computes the expected weekly report number for alerts", () => {
    expect(
      getExpectedRapportWeekForAlerts({
        stageStartDate: new Date("2026-04-01T00:00:00.000Z"),
        stageEndDate: new Date("2026-06-01T00:00:00.000Z"),
        referenceDate: new Date("2026-04-16T00:00:00.000Z"),
      }),
    ).toBe(3);
  });

  it("resolves the next missing evaluation type from stage timing", () => {
    expect(
      resolveMissingEvaluationTypeForAlerts({
        stageStartDate: new Date("2026-04-01T00:00:00.000Z"),
        stageEndDate: new Date("2026-06-01T00:00:00.000Z"),
        existingTypes: [],
        referenceDate: new Date("2026-04-10T00:00:00.000Z"),
      }),
    ).toBe(EvaluationType.DEBUT_STAGE);

    expect(
      resolveMissingEvaluationTypeForAlerts({
        stageStartDate: new Date("2026-04-01T00:00:00.000Z"),
        stageEndDate: new Date("2026-06-01T00:00:00.000Z"),
        existingTypes: [EvaluationType.DEBUT_STAGE],
        referenceDate: new Date("2026-05-10T00:00:00.000Z"),
      }),
    ).toBe(EvaluationType.MI_PARCOURS);

    expect(
      resolveMissingEvaluationTypeForAlerts({
        stageStartDate: new Date("2026-04-01T00:00:00.000Z"),
        stageEndDate: new Date("2026-06-01T00:00:00.000Z"),
        existingTypes: [EvaluationType.DEBUT_STAGE, EvaluationType.MI_PARCOURS],
        referenceDate: new Date("2026-05-28T00:00:00.000Z"),
      }),
    ).toBe(EvaluationType.FINAL);
  });
});
