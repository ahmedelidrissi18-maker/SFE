import { beforeEach, describe, expect, it } from "vitest";
import {
  calculatePercentile,
  getObservabilitySnapshot,
  recordPerformanceSample,
  resetObservabilityStore,
} from "@/lib/observability";

describe("observability helpers", () => {
  beforeEach(() => {
    resetObservabilityStore();
  });

  it("calculates percentiles and warns when analytics latency crosses the budget", () => {
    recordPerformanceSample({
      scope: "analytics-overview",
      durationMs: 1_500,
      cached: true,
      now: new Date("2026-04-15T10:00:00.000Z"),
    });
    recordPerformanceSample({
      scope: "analytics-overview",
      durationMs: 2_250,
      cached: false,
      now: new Date("2026-04-15T10:05:00.000Z"),
    });
    recordPerformanceSample({
      scope: "analytics-export",
      durationMs: 9_000,
      cached: false,
      now: new Date("2026-04-15T10:10:00.000Z"),
    });

    const snapshot = getObservabilitySnapshot(new Date("2026-04-15T10:15:00.000Z"));
    const overviewScope = snapshot.scopes.find((scope) => scope.scope === "analytics-overview");
    const exportScope = snapshot.scopes.find((scope) => scope.scope === "analytics-export");

    expect(calculatePercentile([100, 200, 300], 95)).toBe(300);
    expect(calculatePercentile([], 95)).toBeNull();
    expect(snapshot.status).toBe("warning");
    expect(overviewScope).toMatchObject({
      requestCount: 2,
      cacheHitRate: 50,
      status: "warning",
    });
    expect(exportScope).toMatchObject({
      requestCount: 1,
      status: "ok",
    });
    expect(snapshot.alerts[0]?.id).toBe("analytics-overview-latency");
  });

  it("raises a critical alert when a monitored scope records an error", () => {
    recordPerformanceSample({
      scope: "analytics-export",
      durationMs: 500,
      ok: false,
      now: new Date("2026-04-15T11:00:00.000Z"),
    });

    const snapshot = getObservabilitySnapshot(new Date("2026-04-15T11:05:00.000Z"));

    expect(snapshot.status).toBe("critical");
    expect(snapshot.alerts[0]).toMatchObject({
      id: "analytics-export-errors",
      status: "critical",
    });
  });
});
