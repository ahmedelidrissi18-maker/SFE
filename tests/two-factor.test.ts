import { describe, expect, it } from "vitest";
import {
  consumeRecoveryCode,
  createTwoFactorSecret,
  decryptTwoFactorSecret,
  decryptRecoveryCodesPreview,
  encryptRecoveryCodesPreview,
  encryptTwoFactorSecret,
  formatTwoFactorSecret,
  generateRecoveryCodes,
  generateCurrentTwoFactorCode,
  hashRecoveryCodes,
  isSensitiveTwoFactorRole,
  normalizeRecoveryCode,
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

  it("generates, encrypts and consumes recovery codes", async () => {
    const recoveryCodes = generateRecoveryCodes(2);
    const hashedCodes = await hashRecoveryCodes(recoveryCodes);
    const encryptedPreview = encryptRecoveryCodesPreview(recoveryCodes);
    const consumption = await consumeRecoveryCode(hashedCodes, recoveryCodes[0]);

    expect(recoveryCodes).toHaveLength(2);
    expect(normalizeRecoveryCode(recoveryCodes[0]?.toLowerCase())).toBe(recoveryCodes[0]);
    expect(decryptRecoveryCodesPreview(encryptedPreview)).toEqual(recoveryCodes);
    expect(consumption?.consumed).toBe(true);
    expect(consumption?.remainingHashes).toHaveLength(1);
  });

  it("detects the sensitive roles covered by Sprint 6", () => {
    expect(isSensitiveTwoFactorRole("ADMIN")).toBe(true);
    expect(isSensitiveTwoFactorRole("RH")).toBe(true);
    expect(isSensitiveTwoFactorRole("ENCADRANT")).toBe(false);
  });
});
