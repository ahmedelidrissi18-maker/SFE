ALTER TABLE "User"
ADD COLUMN "twoFactorRecoveryCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "twoFactorRecoveryCodesGeneratedAt" TIMESTAMP(3);
