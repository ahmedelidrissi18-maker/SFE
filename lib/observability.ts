const MONITORING_WINDOW_MS = 30 * 60 * 1000;
const MAX_SAMPLES_PER_SCOPE = 200;

export const monitoringThresholds = {
  "analytics-overview": {
    label: "Chargement analytics",
    targetMs: 2_000,
    criticalMs: 4_000,
  },
  "analytics-export": {
    label: "Export analytics",
    targetMs: 10_000,
    criticalMs: 15_000,
  },
} as const;

export type MonitoringScope = keyof typeof monitoringThresholds;
export type MonitoringStatus = "ok" | "warning" | "critical";

type PerformanceSample = {
  scope: MonitoringScope;
  durationMs: number;
  ok: boolean;
  cached: boolean;
  detail?: string;
  recordedAt: string;
};

export type MonitoringScopeSummary = {
  scope: MonitoringScope;
  label: string;
  requestCount: number;
  errorCount: number;
  averageMs: number | null;
  p95Ms: number | null;
  maxMs: number | null;
  cacheHitRate: number | null;
  targetMs: number;
  lastRecordedAt: string | null;
  status: MonitoringStatus;
};

export type MonitoringAlert = {
  id: string;
  scope: MonitoringScope;
  status: MonitoringStatus;
  title: string;
  description: string;
};

export type ObservabilitySnapshot = {
  status: MonitoringStatus;
  generatedAt: string;
  windowMinutes: number;
  scopes: MonitoringScopeSummary[];
  alerts: MonitoringAlert[];
};

type ObservabilityStore = {
  samples: PerformanceSample[];
};

declare global {
  var __sfeObservabilityStore__: ObservabilityStore | undefined;
}

function getObservabilityStore() {
  if (!globalThis.__sfeObservabilityStore__) {
    globalThis.__sfeObservabilityStore__ = {
      samples: [],
    };
  }

  return globalThis.__sfeObservabilityStore__;
}

function getRecentSamples(now = new Date()) {
  const cutoff = now.getTime() - MONITORING_WINDOW_MS;

  return getObservabilityStore().samples.filter((sample) => {
    return new Date(sample.recordedAt).getTime() >= cutoff;
  });
}

function formatSampleStore(samples: PerformanceSample[]) {
  const byScope = new Map<MonitoringScope, PerformanceSample[]>();

  for (const sample of samples) {
    const scopedSamples = byScope.get(sample.scope) ?? [];
    scopedSamples.push(sample);
    byScope.set(sample.scope, scopedSamples);
  }

  return byScope;
}

export function calculatePercentile(values: number[], percentile: number) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const rawIndex = Math.ceil((percentile / 100) * sorted.length) - 1;
  const normalizedIndex = Math.min(sorted.length - 1, Math.max(0, rawIndex));

  return sorted[normalizedIndex];
}

export function recordPerformanceSample(input: {
  scope: MonitoringScope;
  durationMs: number;
  ok?: boolean;
  cached?: boolean;
  detail?: string;
  now?: Date;
}) {
  const sample: PerformanceSample = {
    scope: input.scope,
    durationMs: Math.max(0, Math.round(input.durationMs)),
    ok: input.ok ?? true,
    cached: input.cached ?? false,
    detail: input.detail,
    recordedAt: (input.now ?? new Date()).toISOString(),
  };

  const store = getObservabilityStore();
  store.samples.push(sample);

  const recentSamples = getRecentSamples(input.now);
  const trimmedSamples = recentSamples
    .sort((left, right) => {
      return new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime();
    })
    .slice(-MAX_SAMPLES_PER_SCOPE * Object.keys(monitoringThresholds).length);

  store.samples = trimmedSamples;
}

function resolveScopeStatus(
  threshold: (typeof monitoringThresholds)[MonitoringScope],
  input: {
    requestCount: number;
    errorCount: number;
    p95Ms: number | null;
  },
): MonitoringStatus {
  if (input.errorCount > 0) {
    return "critical";
  }

  if (input.p95Ms !== null && input.p95Ms > threshold.criticalMs) {
    return "critical";
  }

  if (input.p95Ms !== null && input.p95Ms > threshold.targetMs) {
    return "warning";
  }

  if (input.requestCount === 0) {
    return "ok";
  }

  return "ok";
}

export function getObservabilitySnapshot(now = new Date()): ObservabilitySnapshot {
  const recentSamples = getRecentSamples(now);
  const samplesByScope = formatSampleStore(recentSamples);

  const scopes = (Object.entries(monitoringThresholds) as Array<
    [MonitoringScope, (typeof monitoringThresholds)[MonitoringScope]]
  >).map(([scope, threshold]) => {
    const scopeSamples = samplesByScope.get(scope) ?? [];
    const durations = scopeSamples.map((sample) => sample.durationMs);
    const errorCount = scopeSamples.filter((sample) => !sample.ok).length;
    const cachedCount = scopeSamples.filter((sample) => sample.cached).length;
    const averageMs =
      durations.length > 0
        ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
        : null;
    const p95Ms =
      durations.length > 0 ? Math.round(calculatePercentile(durations, 95) ?? 0) : null;
    const maxMs = durations.length > 0 ? Math.max(...durations) : null;
    const lastRecordedAt = scopeSamples.at(-1)?.recordedAt ?? null;
    const status = resolveScopeStatus(threshold, {
      requestCount: scopeSamples.length,
      errorCount,
      p95Ms,
    });

    return {
      scope,
      label: threshold.label,
      requestCount: scopeSamples.length,
      errorCount,
      averageMs,
      p95Ms,
      maxMs,
      cacheHitRate:
        scopeSamples.length > 0 ? Math.round((cachedCount / scopeSamples.length) * 100) : null,
      targetMs: threshold.targetMs,
      lastRecordedAt,
      status,
    } satisfies MonitoringScopeSummary;
  });

  const alerts: MonitoringAlert[] = scopes.flatMap((scope) => {
    const scopeAlerts: MonitoringAlert[] = [];

    if (scope.errorCount > 0) {
      scopeAlerts.push({
        id: `${scope.scope}-errors`,
        scope: scope.scope,
        status: "critical",
        title: `${scope.label} en erreur`,
        description: `${scope.errorCount} erreur${scope.errorCount > 1 ? "s" : ""} detectee${scope.errorCount > 1 ? "s" : ""} sur les 30 dernieres minutes.`,
      });
    }

    if (scope.p95Ms !== null && scope.p95Ms > scope.targetMs) {
      const isCritical = scope.p95Ms > monitoringThresholds[scope.scope].criticalMs;

      scopeAlerts.push({
        id: `${scope.scope}-latency`,
        scope: scope.scope,
        status: isCritical ? "critical" : "warning",
        title: `${scope.label} au-dessus du budget`,
        description: `p95 observe a ${scope.p95Ms} ms pour une cible de ${scope.targetMs} ms.`,
      });
    }

    return scopeAlerts;
  });

  const status = alerts.some((alert) => alert.status === "critical")
    ? "critical"
    : alerts.some((alert) => alert.status === "warning")
      ? "warning"
      : "ok";

  return {
    status,
    generatedAt: now.toISOString(),
    windowMinutes: MONITORING_WINDOW_MS / (60 * 1000),
    scopes,
    alerts,
  };
}

export function resetObservabilityStore() {
  getObservabilityStore().samples = [];
}
