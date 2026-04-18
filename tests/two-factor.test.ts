import { describe, expect, it } from "vitest";
import {
  createTwoFactorSecret,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  formatTwoFactorSecret,
  generateCurrentTwoFactorCode,
  isSensitiveTwoFactorRole,
  normalizeTwoFactorCode,
  verifyTwoFactorCode,
} from "@/lib/security/two-factor";

describe("two-factor helpers", () => {
  it("encrypts and decrypts a TOTP secret", () => {
    const secret = createTwoFactorSecret();
    const encryptedSecret = encryptTwoFactorSecret(secret);

    expect(encryptedSecret).not.toBe(secret);
    expect(decryptTwoFactorSecret(encryptedSecret)).toBe(secret);
  });

  it("verifies a valid TOTP code", () => {
    const secret = createTwoFactorSecret();
    const code = generateCurrentTwoFactorCode(secret);

    expect(verifyTwoFactorCode(secret, code)).toBe(true);
    expect(verifyTwoFactorCode(secret, "000000")).toBe(false);
  });

  it("normalizes the TOTP code formatting", () => {
    expect(normalizeTwoFactorCode("12 34 56")).toBe("123456");
    expect(formatTwoFactorSecret("ABCDEFGHIJKLMNOP")).toBe("ABCD EFGH IJKL MNOP");
  });

  it("detects the sensitive roles covered by Sprint 6", () => {
    expect(isSensitiveTwoFactorRole("ADMIN")).toBe(true);
    expect(isSensitiveTwoFactorRole("RH")).toBe(true);
    expect(isSensitiveTwoFactorRole("ENCADRANT")).toBe(false);
  });
});
