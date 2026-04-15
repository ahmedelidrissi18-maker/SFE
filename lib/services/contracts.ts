import type { GithubSyncStatus } from "@prisma/client";

export type GitHubRepositoryRef = {
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
};

export type GitHubLinkResult = {
  ok: boolean;
  message: string;
  connection?: {
    id: string;
    username: string;
    profileUrl: string;
    avatarUrl?: string | null;
  };
};

export type GitHubSummary = {
  connection: {
    id: string;
    username: string;
    profileUrl: string;
    avatarUrl?: string | null;
    lastSyncAt?: Date | null;
    lastSyncStatus?: GithubSyncStatus | null;
    lastSyncError?: string | null;
  } | null;
  repository: GitHubRepositoryRef | null;
  latestSync: {
    id: string;
    status: GithubSyncStatus;
    synchronizedAt: Date;
    repositoriesCount: number;
    commitsCount: number;
    pullRequestsCount: number;
    issuesCount: number;
    errorMessage?: string | null;
    payload?: unknown;
  } | null;
};

export type GitHubSyncResult = {
  ok: boolean;
  status: GithubSyncStatus;
  message: string;
  repositoriesCount: number;
  commitsCount: number;
  pullRequestsCount: number;
  issuesCount: number;
  synchronizedAt: Date;
};

export interface GitHubServiceContract {
  connectAccount(input: {
    stagiaireId: string;
    username: string;
    linkedByUserId: string;
  }): Promise<GitHubLinkResult>;
  syncActivity(input: {
    stagiaireId: string;
    actorUserId: string;
  }): Promise<GitHubSyncResult>;
  getSummary(stagiaireId: string): Promise<GitHubSummary>;
}

export interface NotificationServiceContract {
  publish(event: {
    type: string;
    recipients: string[];
    payload?: unknown;
  }): Promise<{ delivered: number; deduplicated: number }>;
  subscribe(input: {
    userId: string;
    channel: string;
  }): Promise<{ ok: boolean; channel: string }>;
  updatePreferences(input: {
    userId: string;
    eventType: string;
    inAppEnabled: boolean;
    liveEnabled: boolean;
  }): Promise<{
    ok: boolean;
    eventType: string;
    inAppEnabled: boolean;
    liveEnabled: boolean;
  }>;
  markAsRead(notificationId: string, userId: string): Promise<void>;
}

export interface PdfServiceContract {
  requestGeneration(payload: {
    template: string;
    actorUserId: string;
    context: Record<string, unknown>;
  }): Promise<{ jobId: string }>;
  getJobStatus(jobId: string): Promise<{
    status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
    downloadUrl?: string;
  }>;
  download(jobId: string, actorUserId: string): Promise<{
    streamUrl?: string;
    signedUrl?: string;
  }>;
}
