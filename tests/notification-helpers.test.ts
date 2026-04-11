import { describe, expect, it } from "vitest";
import { getNotificationTypeLabel } from "@/lib/notifications";

describe("notification helpers", () => {
  it("returns a label for known notification types", () => {
    expect(getNotificationTypeLabel("STAGIAIRE_CREATED")).toBe("Nouveau stagiaire");
    expect(getNotificationTypeLabel("RAPPORT_RETURNED")).toBe("Rapport retourne");
  });

  it("falls back to a generic label", () => {
    expect(getNotificationTypeLabel("UNKNOWN_TYPE")).toBe("Notification");
  });
});
