"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  TWO_FACTOR_RECOVERY_CODES_PREVIEW_COOKIE,
  consumeRecoveryCode,
  createTwoFactorSecret,
  decryptTwoFactorSecret,
  encryptRecoveryCodesPreview,
  generateRecoveryCodes,
  hashRecoveryCodes,
  encryptTwoFactorSecret,
  isSensitiveTwoFactorRole,
  verifyTwoFactorCode,
} from "@/lib/security/two-factor";
import { backupCodeSchema, twoFactorTokenSchema } from "@/lib/validations/auth";

async function getCurrentSensitiveUser() {
  const session = await auth();

  if (!session?.user || !isSensitiveTwoFactorRole(session.user.role)) {
    redirect("/acces-refuse");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorPendingSecret: true,
      twoFactorRecoveryCodes: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
}

function redirectWithStatus(status: "success" | "error", value: string): never {
  redirect(`/securite?${status}=${encodeURIComponent(value)}`);
}

async function setRecoveryCodesPreviewCookie(codes: string[]) {
  const cookieStore = await cookies();
  cookieStore.set(TWO_FACTOR_RECOVERY_CODES_PREVIEW_COOKIE, encryptRecoveryCodesPreview(codes), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/securite",
    maxAge: 60 * 10,
  });
}

async function clearRecoveryCodesPreviewCookie() {
  const cookieStore = await cookies();
  cookieStore.set(TWO_FACTOR_RECOVERY_CODES_PREVIEW_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/securite",
    maxAge: 0,
  });
}

export async function prepareTwoFactorSetupAction() {
  const user = await getCurrentSensitiveUser();

  if (user.twoFactorEnabled) {
    redirectWithStatus("error", "two-factor-already-enabled");
  }

  const encryptedPendingSecret = encryptTwoFactorSecret(createTwoFactorSecret());

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      twoFactorPendingSecret: encryptedPendingSecret,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: "AUTH_2FA_SETUP_PREPARED",
    entite: "AUTH",
    entiteId: user.id,
    nouvelleValeur: {
      role: user.role,
    },
  });

  revalidatePath("/securite");
  redirectWithStatus("success", "two-factor-prepared");
}

export async function cancelTwoFactorSetupAction() {
  const user = await getCurrentSensitiveUser();

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      twoFactorPendingSecret: null,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: "AUTH_2FA_SETUP_CANCELLED",
    entite: "AUTH",
    entiteId: user.id,
  });

  revalidatePath("/securite");
  redirectWithStatus("success", "two-factor-cancelled");
}

export async function confirmTwoFactorSetupAction(formData: FormData) {
  const user = await getCurrentSensitiveUser();
  const parsedData = twoFactorTokenSchema.safeParse({
    twoFactorCode: formData.get("twoFactorCode"),
  });

  if (!parsedData.success) {
    redirectWithStatus("error", "two-factor-code-invalid");
  }

  if (!user.twoFactorPendingSecret) {
    redirectWithStatus("error", "two-factor-not-prepared");
  }

  const decryptedPendingSecret = decryptTwoFactorSecret(user.twoFactorPendingSecret);

  if (!decryptedPendingSecret) {
    redirectWithStatus("error", "two-factor-secret-unavailable");
  }

  if (!verifyTwoFactorCode(decryptedPendingSecret, parsedData.data.twoFactorCode)) {
    await logAuditEvent({
      userId: user.id,
      action: "AUTH_2FA_SETUP_FAILED",
      entite: "AUTH",
      entiteId: user.id,
      nouvelleValeur: {
        reason: "invalid_code",
      },
    });

    redirectWithStatus("error", "two-factor-code-mismatch");
  }

  const recoveryCodes = generateRecoveryCodes();
  const hashedRecoveryCodes = await hashRecoveryCodes(recoveryCodes);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: user.twoFactorPendingSecret,
      twoFactorPendingSecret: null,
      twoFactorRecoveryCodes: hashedRecoveryCodes,
      twoFactorRecoveryCodesGeneratedAt: new Date(),
      twoFactorEnabledAt: new Date(),
    },
  });

  await setRecoveryCodesPreviewCookie(recoveryCodes);

  await logAuditEvent({
    userId: user.id,
    action: "AUTH_2FA_ENABLED",
    entite: "AUTH",
    entiteId: user.id,
    nouvelleValeur: {
      role: user.role,
      recoveryCodesCount: recoveryCodes.length,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/securite");
  redirectWithStatus("success", "two-factor-enabled");
}

export async function disableTwoFactorAction(formData: FormData) {
  const user = await getCurrentSensitiveUser();
  const parsedData = twoFactorTokenSchema.safeParse({
    twoFactorCode: formData.get("twoFactorCode"),
  });

  if (!parsedData.success) {
    redirectWithStatus("error", "two-factor-code-invalid");
  }

  const decryptedSecret = decryptTwoFactorSecret(user.twoFactorSecret);

  if (!user.twoFactorEnabled || !decryptedSecret) {
    redirectWithStatus("error", "two-factor-not-enabled");
  }

  if (!verifyTwoFactorCode(decryptedSecret, parsedData.data.twoFactorCode)) {
    await logAuditEvent({
      userId: user.id,
      action: "AUTH_2FA_DISABLE_FAILED",
      entite: "AUTH",
      entiteId: user.id,
      nouvelleValeur: {
        reason: "invalid_code",
      },
    });

    redirectWithStatus("error", "two-factor-disable-invalid-code");
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorPendingSecret: null,
      twoFactorRecoveryCodes: [],
      twoFactorRecoveryCodesGeneratedAt: null,
      twoFactorEnabledAt: null,
    },
  });

  await clearRecoveryCodesPreviewCookie();

  await logAuditEvent({
    userId: user.id,
    action: "AUTH_2FA_DISABLED",
    entite: "AUTH",
    entiteId: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/securite");
  redirectWithStatus("success", "two-factor-disabled");
}

export async function regenerateTwoFactorRecoveryCodesAction(formData: FormData) {
  const user = await getCurrentSensitiveUser();
  const parsedData = twoFactorTokenSchema.safeParse({
    twoFactorCode: formData.get("twoFactorCode"),
  });

  if (!parsedData.success) {
    redirectWithStatus("error", "two-factor-code-invalid");
  }

  const decryptedSecret = decryptTwoFactorSecret(user.twoFactorSecret);

  if (!user.twoFactorEnabled || !decryptedSecret) {
    redirectWithStatus("error", "two-factor-not-enabled");
  }

  if (!verifyTwoFactorCode(decryptedSecret, parsedData.data.twoFactorCode)) {
    redirectWithStatus("error", "two-factor-disable-invalid-code");
  }

  const recoveryCodes = generateRecoveryCodes();
  const hashedRecoveryCodes = await hashRecoveryCodes(recoveryCodes);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      twoFactorRecoveryCodes: hashedRecoveryCodes,
      twoFactorRecoveryCodesGeneratedAt: new Date(),
    },
  });

  await setRecoveryCodesPreviewCookie(recoveryCodes);

  await logAuditEvent({
    userId: user.id,
    action: "AUTH_2FA_RECOVERY_CODES_REGENERATED",
    entite: "AUTH",
    entiteId: user.id,
    nouvelleValeur: {
      recoveryCodesCount: recoveryCodes.length,
    },
  });

  revalidatePath("/securite");
  redirectWithStatus("success", "two-factor-recovery-codes-regenerated");
}

export async function consumeTwoFactorRecoveryCodeAction(formData: FormData) {
  const user = await getCurrentSensitiveUser();
  const parsedData = backupCodeSchema.safeParse({
    backupCode: formData.get("backupCode"),
  });

  if (!parsedData.success) {
    redirectWithStatus("error", "two-factor-recovery-code-invalid");
  }

  const recoveryCodeConsumption = await consumeRecoveryCode(
    user.twoFactorRecoveryCodes,
    parsedData.data.backupCode,
  );

  if (!recoveryCodeConsumption?.consumed) {
    redirectWithStatus("error", "two-factor-recovery-code-invalid");
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      twoFactorRecoveryCodes: recoveryCodeConsumption.remainingHashes,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: "AUTH_2FA_RECOVERY_CODE_CONSUMED_MANUALLY",
    entite: "AUTH",
    entiteId: user.id,
    nouvelleValeur: {
      remainingRecoveryCodes: recoveryCodeConsumption.remainingHashes.length,
    },
  });

  revalidatePath("/securite");
  redirectWithStatus("success", "two-factor-recovery-code-consumed");
}
