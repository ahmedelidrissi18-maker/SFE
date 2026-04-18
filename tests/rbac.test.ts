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
    expect(canAccessPath("/analytics", "ADMIN")).toBe(true);
    expect(canAccessPath("/analytics", "ENCADRANT")).toBe(true);
    expect(canAccessPath("/analytics", "STAGIAIRE")).toBe(false);
    expect(canAccessPath("/rapports", "ENCADRANT")).toBe(true);
    expect(canAccessPath("/notifications", "RH")).toBe(true);
    expect(canAccessPath("/evaluations", "STAGIAIRE")).toBe(true);
    expect(canAccessPath("/evaluations/eval-1", "ENCADRANT")).toBe(true);
    expect(canAccessPath("/documents", "STAGIAIRE")).toBe(true);
    expect(canAccessPath("/documents/doc-1", "ENCADRANT")).toBe(true);
    expect(canAccessPath("/securite", "ADMIN")).toBe(true);
    expect(canAccessPath("/securite", "RH")).toBe(true);
    expect(canAccessPath("/securite", "ENCADRANT")).toBe(false);
    expect(canAccessPath("/stagiaires", "STAGIAIRE")).toBe(false);
    expect(canAccessPath("/stagiaires/stagiaire-1/github", "STAGIAIRE")).toBe(false);
    expect(canAccessPath("/stagiaires/stagiaire-1/github", "ENCADRANT")).toBe(false);
    expect(canAccessPath("/stagiaires/stagiaire-1/github", "RH")).toBe(true);
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
