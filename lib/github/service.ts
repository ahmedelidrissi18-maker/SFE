import { GithubSyncStatus, Prisma } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { createNotification, createNotificationsForRoles } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import type {
  GitHubRepositoryRef,
  GitHubServiceContract,
  GitHubSummary,
} from "@/lib/services/contracts";

const GITHUB_API_BASE_URL = process.env.GITHUB_API_BASE_URL?.trim() || "https://api.github.com";

type GithubApiProfile = {
  id: number;
  login: string;
  html_url: string;
  avatar_url: string | null;
};

type GithubApiRepo = {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
};

type GithubApiCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    } | null;
  };
};

type GithubApiPullRequest = {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
};

type GithubApiIssue = {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  pull_request?: unknown;
};

type GithubSyncPayload = {
  repository: {
    fullName: string;
    htmlUrl: string;
    description: string | null;
    stargazersCount: number;
    forksCount: number;
    openIssuesCount: number;
  };
  recentCommits: Array<{
    sha: string;
    message: string;
    authorName: string | null;
    committedAt: string | null;
    htmlUrl: string;
  }>;
  recentPullRequests: Array<{
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
    createdAt: string;
  }>;
  recentIssues: Array<{
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
    createdAt: string;
  }>;
};

class GithubServiceError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "INVALID_REPOSITORY" | "RATE_LIMITED" | "API_ERROR",
  ) {
    super(message);
    this.name = "GithubServiceError";
  }
}

function getGithubHeaders() {
  const token = process.env.GITHUB_TOKEN?.trim();

  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "gestion-stagiaires-v2",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubRequest<T>(path: string) {
  const response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
    headers: getGithubHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");

    if ((response.status === 403 || response.status === 429) && remaining === "0") {
      throw new GithubServiceError(
        "Le quota GitHub est atteint. Merci de relancer la synchronisation plus tard.",
        "RATE_LIMITED",
      );
    }

    if (response.status === 404) {
      throw new GithubServiceError(
        "La ressource GitHub demandee est introuvable.",
        "NOT_FOUND",
      );
    }

    throw new GithubServiceError(
      "GitHub ne repond pas correctement pour le moment.",
      "API_ERROR",
    );
  }

  return (await response.json()) as T;
}

export function normalizeGithubUsername(username: string) {
  return username.trim().replace(/^@/, "");
}

export function parseGithubRepositoryUrl(
  repositoryUrl?: string | null,
): GitHubRepositoryRef | null {
  if (!repositoryUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(repositoryUrl);

    if (parsedUrl.hostname !== "github.com") {
      return null;
    }

    const [owner, rawRepositoryName] = parsedUrl.pathname.split("/").filter(Boolean);

    if (!owner || !rawRepositoryName) {
      return null;
    }

    const name = rawRepositoryName.replace(/\.git$/i, "");

    if (!name) {
      return null;
    }

    return {
      owner,
      name,
      fullName: `${owner}/${name}`,
      htmlUrl: `https://github.com/${owner}/${name}`,
    };
  } catch {
    return null;
  }
}

function buildGithubPayload(input: {
  repository: GithubApiRepo;
  commits: GithubApiCommit[];
  pullRequests: GithubApiPullRequest[];
  issues: GithubApiIssue[];
}): GithubSyncPayload {
  return {
    repository: {
      fullName: input.repository.full_name,
      htmlUrl: input.repository.html_url,
      description: input.repository.description,
      stargazersCount: input.repository.stargazers_count,
      forksCount: input.repository.forks_count,
      openIssuesCount: input.repository.open_issues_count,
    },
    recentCommits: input.commits.slice(0, 5).map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      authorName: commit.commit.author?.name ?? null,
      committedAt: commit.commit.author?.date ?? null,
      htmlUrl: commit.html_url,
    })),
    recentPullRequests: input.pullRequests.slice(0, 5).map((pullRequest) => ({
      number: pullRequest.number,
      title: pullRequest.title,
      state: pullRequest.state,
      htmlUrl: pullRequest.html_url,
      createdAt: pullRequest.created_at,
    })),
    recentIssues: input.issues
      .filter((issue) => !issue.pull_request)
      .slice(0, 5)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        htmlUrl: issue.html_url,
        createdAt: issue.created_at,
      })),
  };
}

function getSyncMessage(status: GithubSyncStatus) {
  if (status === GithubSyncStatus.RATE_LIMITED) {
    return "Synchronisation GitHub en attente : quota GitHub atteint.";
  }

  if (status === GithubSyncStatus.ERROR) {
    return "La synchronisation GitHub a echoue.";
  }

  return "Synchronisation GitHub terminee avec succes.";
}

export function getGithubSyncStatusLabel(status?: GithubSyncStatus | null) {
  switch (status) {
    case GithubSyncStatus.SUCCESS:
      return "Synchro OK";
    case GithubSyncStatus.RATE_LIMITED:
      return "Quota GitHub";
    case GithubSyncStatus.ERROR:
      return "Erreur sync";
    default:
      return "Jamais synchronise";
  }
}

function toSummary(connection: {
  id: string;
  username: string;
  profileUrl: string;
  avatarUrl: string | null;
  lastSyncAt: Date | null;
  lastSyncStatus: GithubSyncStatus | null;
  lastSyncError: string | null;
  syncLogs: Array<{
    id: string;
    status: GithubSyncStatus;
    synchronizedAt: Date;
    repositoriesCount: number;
    commitsCount: number;
    pullRequestsCount: number;
    issuesCount: number;
    errorMessage: string | null;
    payload: Prisma.JsonValue | null;
  }>;
} | null,
repository: GitHubRepositoryRef | null): GitHubSummary {
  const latestSync = connection?.syncLogs[0] ?? null;

  return {
    connection: connection
      ? {
          id: connection.id,
          username: connection.username,
          profileUrl: connection.profileUrl,
          avatarUrl: connection.avatarUrl,
          lastSyncAt: connection.lastSyncAt,
          lastSyncStatus: connection.lastSyncStatus,
          lastSyncError: connection.lastSyncError,
        }
      : null,
    repository,
    latestSync: latestSync
      ? {
          id: latestSync.id,
          status: latestSync.status,
          synchronizedAt: latestSync.synchronizedAt,
          repositoriesCount: latestSync.repositoriesCount,
          commitsCount: latestSync.commitsCount,
          pullRequestsCount: latestSync.pullRequestsCount,
          issuesCount: latestSync.issuesCount,
          errorMessage: latestSync.errorMessage,
          payload: latestSync.payload,
        }
      : null,
  };
}

export const githubService: GitHubServiceContract = {
  async connectAccount({ stagiaireId, username, linkedByUserId }) {
    const normalizedUsername = normalizeGithubUsername(username);

    const existingStagiaire = await prisma.stagiaire.findUnique({
      where: { id: stagiaireId },
      include: {
        user: {
          select: {
            prenom: true,
            nom: true,
          },
        },
      },
    });

    if (!existingStagiaire) {
      return {
        ok: false,
        message: "Stagiaire introuvable.",
      };
    }

    let profile: GithubApiProfile;

    try {
      profile = await githubRequest<GithubApiProfile>(`/users/${normalizedUsername}`);
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof GithubServiceError
            ? error.message
            : "Connexion au profil GitHub impossible pour le moment.",
      };
    }

    const existingConnectionForGithubUser = await prisma.githubConnection.findFirst({
      where: {
        githubUserId: String(profile.id),
        stagiaireId: {
          not: stagiaireId,
        },
      },
      select: {
        stagiaireId: true,
      },
    });

    if (existingConnectionForGithubUser) {
      return {
        ok: false,
        message: "Ce compte GitHub est deja lie a un autre stagiaire.",
      };
    }

    const connection = await prisma.githubConnection.upsert({
      where: { stagiaireId },
      create: {
        stagiaireId,
        username: profile.login,
        githubUserId: String(profile.id),
        profileUrl: profile.html_url,
        avatarUrl: profile.avatar_url,
        linkedByUserId,
      },
      update: {
        username: profile.login,
        githubUserId: String(profile.id),
        profileUrl: profile.html_url,
        avatarUrl: profile.avatar_url,
        linkedByUserId,
        lastSyncError: null,
      },
    });

    await logAuditEvent({
      userId: linkedByUserId,
      action: "GITHUB_ACCOUNT_LINKED",
      entite: "GithubConnection",
      entiteId: connection.id,
      nouvelleValeur: {
        stagiaireId,
        username: connection.username,
        profileUrl: connection.profileUrl,
      },
    });

    return {
      ok: true,
      message: `Compte GitHub ${profile.login} lie a ${existingStagiaire.user.prenom} ${existingStagiaire.user.nom}.`,
      connection: {
        id: connection.id,
        username: connection.username,
        profileUrl: connection.profileUrl,
        avatarUrl: connection.avatarUrl,
      },
    };
  },

  async syncActivity({ stagiaireId, actorUserId }) {
    const stagiaire = await prisma.stagiaire.findUnique({
      where: { id: stagiaireId },
      include: {
        githubConnection: true,
        stages: {
          where: {
            githubRepo: {
              not: null,
            },
          },
          orderBy: [{ createdAt: "desc" }],
          take: 1,
        },
      },
    });

    if (!stagiaire?.githubConnection) {
      return {
        ok: false,
        status: GithubSyncStatus.ERROR,
        message: "Aucun compte GitHub n est encore lie a ce stagiaire.",
        repositoriesCount: 0,
        commitsCount: 0,
        pullRequestsCount: 0,
        issuesCount: 0,
        synchronizedAt: new Date(),
      };
    }

    const stage = stagiaire.stages[0] ?? null;
    const repositoryRef = parseGithubRepositoryUrl(stage?.githubRepo ?? null);

    if (!repositoryRef) {
      return {
        ok: false,
        status: GithubSyncStatus.ERROR,
        message:
          "Le stage courant ne contient pas encore de depot GitHub exploitable pour lancer la synchronisation.",
        repositoriesCount: 0,
        commitsCount: 0,
        pullRequestsCount: 0,
        issuesCount: 0,
        synchronizedAt: new Date(),
      };
    }

    const synchronizedAt = new Date();
    const startedAt = Date.now();

    try {
      const [repository, commits, pullRequests, issues] = await Promise.all([
        githubRequest<GithubApiRepo>(`/repos/${repositoryRef.owner}/${repositoryRef.name}`),
        githubRequest<GithubApiCommit[]>(
          `/repos/${repositoryRef.owner}/${repositoryRef.name}/commits?per_page=20`,
        ),
        githubRequest<GithubApiPullRequest[]>(
          `/repos/${repositoryRef.owner}/${repositoryRef.name}/pulls?state=all&per_page=20`,
        ),
        githubRequest<GithubApiIssue[]>(
          `/repos/${repositoryRef.owner}/${repositoryRef.name}/issues?state=all&per_page=20`,
        ),
      ]);

      const filteredIssues = issues.filter((issue) => !issue.pull_request);
      const payload = buildGithubPayload({
        repository,
        commits,
        pullRequests,
        issues,
      });

      await prisma.$transaction([
        prisma.githubConnection.update({
          where: { id: stagiaire.githubConnection.id },
          data: {
            lastSyncAt: synchronizedAt,
            lastSyncStatus: GithubSyncStatus.SUCCESS,
            lastSyncError: null,
          },
        }),
        prisma.githubSyncLog.create({
          data: {
            connectionId: stagiaire.githubConnection.id,
            stageId: stage?.id,
            triggeredByUserId: actorUserId,
            status: GithubSyncStatus.SUCCESS,
            repositoriesCount: 1,
            commitsCount: commits.length,
            pullRequestsCount: pullRequests.length,
            issuesCount: filteredIssues.length,
            synchronizedAt,
            durationMs: Date.now() - startedAt,
            payload: payload as Prisma.InputJsonValue,
          },
        }),
      ]);

      await logAuditEvent({
        userId: actorUserId,
        action: "GITHUB_SYNC_SUCCESS",
        entite: "GithubConnection",
        entiteId: stagiaire.githubConnection.id,
        nouvelleValeur: {
          stagiaireId,
          stageId: stage?.id,
          repository: repositoryRef.fullName,
          commitsCount: commits.length,
          pullRequestsCount: pullRequests.length,
          issuesCount: filteredIssues.length,
        },
      });

      await createNotification({
        destinataireId: actorUserId,
        type: "GITHUB_SYNC_SUCCESS",
        titre: "Synchronisation GitHub terminee",
        message: `La synchronisation du depot ${repositoryRef.fullName} est terminee avec succes.`,
        lien: `/stagiaires/${stagiaireId}/github`,
      });

      await createNotificationsForRoles(
        ["ADMIN", "RH"],
        {
          type: "GITHUB_SYNC_SUCCESS",
          titre: "Synchronisation GitHub terminee",
          message: `Le depot ${repositoryRef.fullName} a ete synchronise pour un stagiaire.`,
          lien: `/stagiaires/${stagiaireId}/github`,
        },
        [actorUserId],
      );

      return {
        ok: true,
        status: GithubSyncStatus.SUCCESS,
        message: getSyncMessage(GithubSyncStatus.SUCCESS),
        repositoriesCount: 1,
        commitsCount: commits.length,
        pullRequestsCount: pullRequests.length,
        issuesCount: filteredIssues.length,
        synchronizedAt,
      };
    } catch (error) {
      const status =
        error instanceof GithubServiceError && error.code === "RATE_LIMITED"
          ? GithubSyncStatus.RATE_LIMITED
          : GithubSyncStatus.ERROR;
      const errorMessage =
        error instanceof GithubServiceError
          ? error.message
          : "La synchronisation GitHub a echoue pour une raison inattendue.";

      await prisma.$transaction([
        prisma.githubConnection.update({
          where: { id: stagiaire.githubConnection.id },
          data: {
            lastSyncAt: synchronizedAt,
            lastSyncStatus: status,
            lastSyncError: errorMessage,
          },
        }),
        prisma.githubSyncLog.create({
          data: {
            connectionId: stagiaire.githubConnection.id,
            stageId: stage?.id,
            triggeredByUserId: actorUserId,
            status,
            repositoriesCount: 0,
            commitsCount: 0,
            pullRequestsCount: 0,
            issuesCount: 0,
            synchronizedAt,
            durationMs: Date.now() - startedAt,
            errorMessage,
          },
        }),
      ]);

      await logAuditEvent({
        userId: actorUserId,
        action: "GITHUB_SYNC_FAILED",
        entite: "GithubConnection",
        entiteId: stagiaire.githubConnection.id,
        nouvelleValeur: {
          stagiaireId,
          stageId: stage?.id,
          repository: repositoryRef.fullName,
          status,
          error: errorMessage,
        },
      });

      await createNotification({
        destinataireId: actorUserId,
        type: "GITHUB_SYNC_FAILED",
        titre: "Synchronisation GitHub echouee",
        message: errorMessage,
        lien: `/stagiaires/${stagiaireId}/github`,
      });

      return {
        ok: false,
        status,
        message: errorMessage,
        repositoriesCount: 0,
        commitsCount: 0,
        pullRequestsCount: 0,
        issuesCount: 0,
        synchronizedAt,
      };
    }
  },

  async getSummary(stagiaireId) {
    const stagiaire = await prisma.stagiaire.findUnique({
      where: { id: stagiaireId },
      include: {
        githubConnection: {
          include: {
            syncLogs: {
              orderBy: [{ synchronizedAt: "desc" }],
              take: 1,
            },
          },
        },
        stages: {
          where: {
            githubRepo: {
              not: null,
            },
          },
          orderBy: [{ createdAt: "desc" }],
          take: 1,
        },
      },
    });

    return toSummary(
      stagiaire?.githubConnection ?? null,
      parseGithubRepositoryUrl(stagiaire?.stages[0]?.githubRepo ?? null),
    );
  },
};
