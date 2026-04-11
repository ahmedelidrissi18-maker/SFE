import { describe, expect, it } from "vitest";
import { canAccessPath, hasRole, isAuthRoute, isPublicRoute } from "@/lib/rbac";

describe("rbac helpers", () => {
  it("detects public and auth routes", () => {
    expect(isPublicRoute("/")).toBe(true);
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/dashboard")).toBe(false);
    expect(isAuthRoute("/login")).toBe(true);
    expect(isAuthRoute("/dashboard")).toBe(false);
  });

  it("applies access rules by role", () => {
    expect(canAccessPath("/dashboard", "STAGIAIRE")).toBe(true);
    expect(canAccessPath("/rapports", "ENCADRANT")).toBe(true);
    expect(canAccessPath("/notifications", "RH")).toBe(true);
    expect(canAccessPath("/stagiaires", "STAGIAIRE")).toBe(false);
    expect(canAccessPath("/stages", "STAGIAIRE")).toBe(false);
    expect(canAccessPath("/stages", "ENCADRANT")).toBe(true);
  });

  it("allows unruled paths for authenticated users only", () => {
    expect(canAccessPath("/profil-inexistant", "ADMIN")).toBe(true);
    expect(canAccessPath("/profil-inexistant", null)).toBe(false);
  });

  it("checks simple role inclusion", () => {
    expect(hasRole("ADMIN", ["ADMIN", "RH"])).toBe(true);
    expect(hasRole("STAGIAIRE", ["ADMIN", "RH"])).toBe(false);
    expect(hasRole(undefined, ["ADMIN"])).toBe(false);
  });
});
