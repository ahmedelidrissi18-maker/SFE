CREATE TYPE "GithubSyncStatus" AS ENUM ('SUCCESS', 'ERROR', 'RATE_LIMITED');

CREATE TABLE "GithubConnection" (
    "id" TEXT NOT NULL,
    "stagiaireId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "githubUserId" TEXT,
    "profileUrl" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "linkedByUserId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" "GithubSyncStatus",
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GithubConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GithubSyncLog" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "stageId" TEXT,
    "triggeredByUserId" TEXT NOT NULL,
    "status" "GithubSyncStatus" NOT NULL,
    "repositoriesCount" INTEGER NOT NULL DEFAULT 0,
    "commitsCount" INTEGER NOT NULL DEFAULT 0,
    "pullRequestsCount" INTEGER NOT NULL DEFAULT 0,
    "issuesCount" INTEGER NOT NULL DEFAULT 0,
    "synchronizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "payload" JSONB,

    CONSTRAINT "GithubSyncLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GithubConnection_stagiaireId_key" ON "GithubConnection"("stagiaireId");
CREATE UNIQUE INDEX "GithubConnection_githubUserId_key" ON "GithubConnection"("githubUserId");
CREATE INDEX "GithubConnection_username_idx" ON "GithubConnection"("username");
CREATE INDEX "GithubSyncLog_connectionId_synchronizedAt_idx" ON "GithubSyncLog"("connectionId", "synchronizedAt");
CREATE INDEX "GithubSyncLog_triggeredByUserId_synchronizedAt_idx" ON "GithubSyncLog"("triggeredByUserId", "synchronizedAt");
CREATE INDEX "GithubSyncLog_stageId_synchronizedAt_idx" ON "GithubSyncLog"("stageId", "synchronizedAt");

ALTER TABLE "GithubConnection" ADD CONSTRAINT "GithubConnection_stagiaireId_fkey" FOREIGN KEY ("stagiaireId") REFERENCES "Stagiaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GithubConnection" ADD CONSTRAINT "GithubConnection_linkedByUserId_fkey" FOREIGN KEY ("linkedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GithubSyncLog" ADD CONSTRAINT "GithubSyncLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GithubConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GithubSyncLog" ADD CONSTRAINT "GithubSyncLog_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GithubSyncLog" ADD CONSTRAINT "GithubSyncLog_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
