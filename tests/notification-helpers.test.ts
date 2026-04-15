import { describe, expect, it } from "vitest";
import { getNotificationTypeLabel, notificationEventDefinitions } from "@/lib/notifications";

describe("notification helpers", () => {
  it("returns a label for known notification types", () => {
    expect(getNotificationTypeLabel("STAGIAIRE_CREATED")).toBe("Nouveau stagiaire");
    expect(getNotificationTypeLabel("RAPPORT_RETURNED")).toBe("Rapport retourne");
    expect(getNotificationTypeLabel("GITHUB_SYNC_SUCCESS")).toBe("Synchro GitHub terminee");
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
});
