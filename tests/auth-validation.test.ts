import { describe, expect, it } from "vitest";
import { loginFormSchema, twoFactorTokenSchema } from "@/lib/validations/auth";

describe("auth validation schemas", () => {
  it("accepts a login payload without 2FA when the field is empty", () => {
    const parsed = loginFormSchema.safeParse({
      email: "ADMIN@stagiaires.local",
      password: "Password123!",
      twoFactorCode: "",
      backupCode: "",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.email).toBe("admin@stagiaires.local");
  });

  it("rejects malformed 2FA codes at login", () => {
    const parsed = loginFormSchema.safeParse({
      email: "admin@stagiaires.local",
      password: "Password123!",
      twoFactorCode: "12345",
      backupCode: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts a recovery code with the expected format", () => {
    const parsed = loginFormSchema.safeParse({
      email: "admin@stagiaires.local",
      password: "Password123!",
      twoFactorCode: "",
      backupCode: "ABCD-EFGH",
    });

    expect(parsed.success).toBe(true);
  });

  it("requires a 6-digit code for security actions", () => {
    expect(
      twoFactorTokenSchema.safeParse({
        twoFactorCode: "123456",
      }).success,
    ).toBe(true);
    expect(
      twoFactorTokenSchema.safeParse({
        twoFactorCode: "abc123",
      }).success,
    ).toBe(false);
  });
});
