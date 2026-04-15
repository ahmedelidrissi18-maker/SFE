CREATE TYPE "NotificationDispatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "NotificationDispatchJob" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "recipientIds" JSONB NOT NULL,
    "status" "NotificationDispatchStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "triggeredByUserId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDispatchJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationDispatchJob_status_availableAt_idx" ON "NotificationDispatchJob"("status", "availableAt");
CREATE INDEX "NotificationDispatchJob_triggeredByUserId_idx" ON "NotificationDispatchJob"("triggeredByUserId");

ALTER TABLE "NotificationDispatchJob" ADD CONSTRAINT "NotificationDispatchJob_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
