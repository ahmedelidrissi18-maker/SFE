import { NotificationDispatchStatus, PdfGenerationStatus } from "@prisma/client";
import { getAppEnv } from "@/lib/env";
import { getDocumentStorageHealth } from "@/lib/document-storage";
import { getObservabilitySnapshot } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import { getRedisHealth } from "@/lib/redis";

type DependencyState = "ok" | "warning" | "degraded" | "down" | "disabled";

export type HealthSnapshot = {
  status: "ok" | "degraded";
  service: string;
  timestamp: string;
  dependencies: {
    database: {
      status: DependencyState;
      latencyMs: number | null;
      detail: string;
    };
    redis: {
      status: DependencyState;
      latencyMs: number | null;
      detail: string;
    };
    documentStorage: {
      status: DependencyState;
      detail: string;
      root: string;
    };
    asyncQueues: {
      status: DependencyState;
      pendingNotificationJobs: number;
      pendingPdfJobs: number;
      warningThreshold: number;
      criticalThreshold: number;
    };
  };
  observability: ReturnType<typeof getObservabilitySnapshot>;
};

async function getDatabaseHealth() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok" as const,
      latencyMs: Date.now() - startedAt,
      detail: "Connexion PostgreSQL valide.",
    };
  } catch (error) {
    return {
      status: "down" as const,
      latencyMs: Date.now() - startedAt,
      detail: error instanceof Error ? error.message : "database_unreachable",
    };
  }
}

async function getAsyncQueuesHealth() {
  const env = getAppEnv();

  try {
    const [pendingNotificationJobs, pendingPdfJobs] = await Promise.all([
      prisma.notificationDispatchJob.count({
        where: {
          status: {
            in: [NotificationDispatchStatus.PENDING, NotificationDispatchStatus.FAILED],
          },
        },
      }),
      prisma.pdfGenerationJob.count({
        where: {
          status: {
            in: [PdfGenerationStatus.PENDING, PdfGenerationStatus.FAILED],
          },
        },
      }),
    ]);
    const totalPendingJobs = pendingNotificationJobs + pendingPdfJobs;
    const status =
      totalPendingJobs >= env.HEALTHCHECK_QUEUE_CRITICAL_THRESHOLD
        ? "degraded"
        : totalPendingJobs >= env.HEALTHCHECK_QUEUE_WARNING_THRESHOLD
          ? "warning"
          : "ok";

    return {
      status,
      pendingNotificationJobs,
      pendingPdfJobs,
      warningThreshold: env.HEALTHCHECK_QUEUE_WARNING_THRESHOLD,
      criticalThreshold: env.HEALTHCHECK_QUEUE_CRITICAL_THRESHOLD,
    } as const;
  } catch {
    return {
      status: "down" as const,
      pendingNotificationJobs: 0,
      pendingPdfJobs: 0,
      warningThreshold: env.HEALTHCHECK_QUEUE_WARNING_THRESHOLD,
      criticalThreshold: env.HEALTHCHECK_QUEUE_CRITICAL_THRESHOLD,
    };
  }
}

function resolveHealthStatus(input: {
  database: { status: DependencyState };
  redis: { status: DependencyState };
  documentStorage: { status: DependencyState };
  asyncQueues: { status: DependencyState };
  observability: ReturnType<typeof getObservabilitySnapshot>;
}) {
  const dependencyStates = [
    input.database.status,
    input.redis.status,
    input.documentStorage.status,
    input.asyncQueues.status,
  ];

  if (
    dependencyStates.includes("down") ||
    dependencyStates.includes("degraded") ||
    input.observability.status === "critical"
  ) {
    return "degraded" as const;
  }

  return "ok" as const;
}

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const [database, redis, documentStorage, asyncQueues] = await Promise.all([
    getDatabaseHealth(),
    getRedisHealth(),
    getDocumentStorageHealth(),
    getAsyncQueuesHealth(),
  ]);
  const observability = getObservabilitySnapshot();
  const status = resolveHealthStatus({
    database,
    redis,
    documentStorage,
    asyncQueues,
    observability,
  });

  return {
    status,
    service: "gestion-stagiaires",
    timestamp: new Date().toISOString(),
    dependencies: {
      database,
      redis,
      documentStorage,
      asyncQueues,
    },
    observability,
  };
}
