import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canAccessPath, isAuthRoute, isPublicRoute } from "@/lib/rbac";

describe("V1 smoke critical paths", () => {
  it("keeps critical route files present", () => {
    expect(existsSync("app/(auth)/login/page.tsx")).toBe(true);
    expect(existsSync("app/(dashboard)/layout.tsx")).toBe(true);
    expect(existsSync("app/(dashboard)/dashboard/page.tsx")).toBe(true);
    expect(existsSync("app/(dashboard)/stagiaires/page.tsx")).toBe(true);
    expect(existsSync("app/(dashboard)/stagiaires/[id]/github/page.tsx")).toBe(true);
    expect(existsSync("app/acces-refuse/page.tsx")).toBe(true);
  });

  it("keeps public/auth/protected boundaries for critical pages", () => {
    expect(isPublicRoute("/login")).toBe(true);
    expect(isAuthRoute("/login")).toBe(true);
    expect(isPublicRoute("/dashboard")).toBe(false);
    expect(isPublicRoute("/stagiaires")).toBe(false);
  });

  it("keeps RBAC protections on V1 critical pages", () => {
    expect(canAccessPath("/dashboard", "STAGIAIRE")).toBe(true);
    expect(canAccessPath("/stagiaires", "RH")).toBe(true);
    expect(canAccessPath("/stagiaires", "STAGIAIRE")).toBe(false);
    expect(canAccessPath("/stagiaires", null)).toBe(false);
  });
});
