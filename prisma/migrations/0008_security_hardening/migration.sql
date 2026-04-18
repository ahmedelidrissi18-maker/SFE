ALTER TABLE "User"
ADD COLUMN "twoFactorSecret" TEXT,
ADD COLUMN "twoFactorPendingSecret" TEXT,
ADD COLUMN "twoFactorEnabledAt" TIMESTAMP(3);

