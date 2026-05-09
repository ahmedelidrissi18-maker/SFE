import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import {
  generateSecret,
  generateSync,
  generateURI,
  verifySync,
} from "otplib";
import type { Role } from "@prisma/client";
import { getAppEnv } from "@/lib/env";

const SENSITIVE_TWO_FACTOR_ROLES = new Set<Role>(["ADMIN", "RH"]);
const DEVELOPMENT_FALLBACK_SECRET = "development-two-factor-secret";
const TWO_FACTOR_DIGITS = 6;
const TWO_FACTOR_PERIOD = 30;
const RECOVERY_CODE_COUNT = 8;

export const TWO_FACTOR_RECOVERY_CODES_PREVIEW_COOKIE =
  "sfe-two-factor-recovery-codes-preview";

function getTwoFactorEncryptionSecret() {
  const env = getAppEnv();
  const configuredSecret =
    env.TWO_FACTOR_ENCRYPTION_SECRET ||
    env.NEXTAUTH_SECRET ||
    env.AUTH_SECRET;

  if (configuredSecret) {
    return configuredSecret;
  }

  if (env.NODE_ENV !== "production") {
    return DEVELOPMENT_FALLBACK_SECRET;
  }

  throw new Error(
    "Un secret de chiffrement 2FA est requis en production via TWO_FACTOR_ENCRYPTION_SECRET ou NEXTAUTH_SECRET.",
  );
}

function getEncryptionKey() {
  return createHash("sha256").update(getTwoFactorEncryptionSecret()).digest();
}

function encryptProtectedValue(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptProtectedValue(payload: string | null | undefined) {
  if (!payload) {
    return null;
  }

  const [version, ivEncoded, tagEncoded, encryptedEncoded] = payload.split(".");

  if (version !== "v1" || !ivEncoded || !tagEncoded || !encryptedEncoded) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivEncoded, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, "base64url")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function isSensitiveTwoFactorRole(role: Role | string | null | undefined) {
  return role ? SENSITIVE_TWO_FACTOR_ROLES.has(role as Role) : false;
}

export function createTwoFactorSecret() {
  return generateSecret();
}

export function normalizeTwoFactorCode(code: string | null | undefined) {
  return (code ?? "").replace(/\s+/g, "").trim();
}

export function encryptTwoFactorSecret(secret: string) {
  return encryptProtectedValue(secret);
}

export function decryptTwoFactorSecret(payload: string | null | undefined) {
  return decryptProtectedValue(payload);
}

export function verifyTwoFactorCode(secret: string, code: string | null | undefined) {
  const normalizedCode = normalizeTwoFactorCode(code);

  if (!normalizedCode) {
    return false;
  }

  return verifySync({
    token: normalizedCode,
    secret,
    strategy: "totp",
    digits: TWO_FACTOR_DIGITS,
    period: TWO_FACTOR_PERIOD,
    epochTolerance: 1,
  }).valid;
}

export function buildTwoFactorOtpAuthUri(email: string, secret: string) {
  const issuer = getAppEnv().TWO_FACTOR_ISSUER;
  return generateURI({
    strategy: "totp",
    issuer,
    label: email,
    secret,
    digits: TWO_FACTOR_DIGITS,
    period: TWO_FACTOR_PERIOD,
  });
}

export async function generateTwoFactorQrCodeDataUrl(otpAuthUrl: string) {
  return QRCode.toDataURL(otpAuthUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
  });
}

export function formatTwoFactorSecret(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

export function generateCurrentTwoFactorCode(secret: string) {
  return generateSync({
    secret,
    strategy: "totp",
    digits: TWO_FACTOR_DIGITS,
    period: TWO_FACTOR_PERIOD,
  });
}

export function normalizeRecoveryCode(code: string | null | undefined) {
  return (code ?? "").trim().toUpperCase();
}

function formatRecoveryCode(rawValue: string) {
  return `${rawValue.slice(0, 4)}-${rawValue.slice(4, 8)}`;
}

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT) {
  return Array.from({ length: count }, () =>
    formatRecoveryCode(randomBytes(4).toString("hex").toUpperCase()),
  );
}

export async function hashRecoveryCode(code: string) {
  return bcrypt.hash(normalizeRecoveryCode(code), 10);
}

export async function hashRecoveryCodes(codes: string[]) {
  return Promise.all(codes.map((code) => hashRecoveryCode(code)));
}

export async function consumeRecoveryCode(
  storedHashes: string[],
  candidateCode: string | null | undefined,
) {
  const normalizedCandidate = normalizeRecoveryCode(candidateCode);

  if (!normalizedCandidate) {
    return null;
  }

  for (const [index, hash] of storedHashes.entries()) {
    if (await bcrypt.compare(normalizedCandidate, hash)) {
      return {
        consumed: true,
        remainingHashes: storedHashes.filter((_, currentIndex) => currentIndex !== index),
      };
    }
  }

  return null;
}

export function encryptRecoveryCodesPreview(codes: string[]) {
  return encryptProtectedValue(JSON.stringify(codes));
}

export function decryptRecoveryCodesPreview(payload: string | null | undefined) {
  const decryptedPayload = decryptProtectedValue(payload);

  if (!decryptedPayload) {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(decryptedPayload);

    if (
      Array.isArray(parsedPayload) &&
      parsedPayload.every((value) => typeof value === "string")
    ) {
      return parsedPayload;
    }
  } catch {
    return null;
  }

  return null;
}
