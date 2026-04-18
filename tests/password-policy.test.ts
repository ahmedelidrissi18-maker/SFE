import { describe, expect, it } from "vitest";
import {
  getPasswordPolicyDescription,
  validatePasswordStrength,
} from "@/lib/security/password-policy";

describe("password policy helpers", () => {
  it("accepts a strong password", () => {
    const result = validatePasswordStrength("StrongPass123!");

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("reports the missing password requirements", () => {
    const result = validatePasswordStrength("weak");

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      "min_length",
      "uppercase",
      "number",
      "special_character",
    ]);
  });

  it("describes the policy in plain text", () => {
    expect(getPasswordPolicyDescription()).toContain("au moins 12 caracteres");
  });
});

