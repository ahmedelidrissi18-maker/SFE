import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import QRCode from "qrcode";
import {
  generate,
  generateSecret,
  generateSync,
  generateURI,
  verifySync,
} from "otplib";
import type { Role } from "@prisma/client";

const SENSITIVE_TWO_FACTOR_ROLES = new Set<Role>(["ADMIN", "RH"]);
const DEVELOPMENT_FALLBACK_SECRET = "development-two-factor-secret";
const TWO_FACTOR_DIGITS = 6;
const TWO_FACTOR_PERIOD = 30;

function getTwoFactorEncryptionSecret() {
  const configuredSecret =
    process.env.TWO_FACTOR_ENCRYPTION_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_FALLBACK_SECRET;
  }

  throw new Error(
    "Un secret de chiffrement 2FA est requis en production via TWO_FACTOR_ENCRYPTION_SECRET ou NEXTAUTH_SECRET.",
  );
}

function getEncryptionKey() {
  return createHash("sha256").update(getTwoFactorEncryptionSecret()).digest();
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
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptTwoFactorSecret(payload: string | null | undefined) {
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
  const issuer = process.env.TWO_FACTOR_ISSUER?.trim() || "Gestion des Stagiaires";
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
