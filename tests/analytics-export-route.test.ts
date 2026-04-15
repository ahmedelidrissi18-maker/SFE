import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getAnalyticsOverviewWithMetaMock = vi.fn();
const recordPerformanceSampleMock = vi.fn();
const buildAnalyticsCsvMock = vi.fn();
const buildDetailedAnalyticsCsvMock = vi.fn();
const buildDepartmentAnalyticsCsvMock = vi.fn();

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/analytics", () => ({
  analyticsExportModeDefinitions: {
    overview: { label: "KPI" },
    detailed: { label: "Detail stages" },
    departments: { label: "Detail departements" },
  },
  analyticsPeriodDefinitions: {
    weekly: { label: "7 derniers jours" },
    monthly: { label: "30 derniers jours" },
    quarterly: { label: "90 derniers jours" },
  },
  buildAnalyticsCsv: buildAnalyticsCsvMock,
  buildDetailedAnalyticsCsv: buildDetailedAnalyticsCsvMock,
  buildDepartmentAnalyticsCsv: buildDepartmentAnalyticsCsvMock,
  canAccessAnalytics: (role: string) => role !== "STAGIAIRE",
  filterDepartmentAnalytics: (departments: Array<{ departement: string }>, department?: string | null) =>
    department ? departments.filter((row) => row.departement === department) : departments,
  filterStageAnalyticsDetails: (
    stages: Array<{ departement: string; attentionLabel: string }>,
    filters: { department?: string | null; attention?: string; limit?: number },
  ) => {
    let rows = stages.filter((stage) => {
      return filters.department ? stage.departement === filters.department : true;
    });

    if (filters.attention === "critical") {
      rows = rows.filter((stage) => stage.attentionLabel === "Critique");
    }

    return filters.limit ? rows.slice(0, filters.limit) : rows;
  },
  getAnalyticsOverviewWithMeta: getAnalyticsOverviewWithMetaMock,
  resolveAnalyticsAttentionFilter: (value?: string | null) => (value === "critical" ? "critical" : "all"),
  resolveAnalyticsDepartmentFilter: (
    value: string | null | undefined,
    departments: Array<{ departement: string }>,
  ) => (departments.some((department) => department.departement === value) ? value ?? null : null),
  resolveAnalyticsExportMode: (value?: string | null) => {
    if (value === "departments") {
      return "departments";
    }

    if (value === "detailed") {
      return "detailed";
    }

    return "overview";
  },
  resolveAnalyticsPeriod: (value?: string | null) => (value === "weekly" ? "weekly" : "monthly"),
  resolveAnalyticsStageDetailLimit: (value?: string | null) => (value === "25" ? 25 : 8),
}));

vi.mock("@/lib/observability", () => ({
  recordPerformanceSample: recordPerformanceSampleMock,
}));

describe("analytics export route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("redirige vers /login quand la session est absente", async () => {
    authMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/analytics/export/route");
    const response = await GET(
      new Request("http://localhost:3000/api/analytics/export?mode=overview"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("redirige vers /acces-refuse pour un role non autorise", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-stg-1",
        role: "STAGIAIRE",
      },
    });

    const { GET } = await import("@/app/api/analytics/export/route");
    const response = await GET(
      new Request("http://localhost:3000/api/analytics/export?mode=overview"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/acces-refuse");
  });

  it("exporte les departements avec les filtres detail et la telemetry Sprint 5", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-admin-1",
        role: "ADMIN",
      },
    });
    getAnalyticsOverviewWithMetaMock.mockResolvedValue({
      overview: {
        period: "monthly",
        range: {
          start: new Date("2026-04-01T00:00:00.000Z"),
          end: new Date("2026-04-30T00:00:00.000Z"),
          label: "01 avr. 2026 au 30 avr. 2026",
        },
        scopeLabel: "pilotage global",
        metrics: [],
        focusItems: [],
        departments: [
          {
            departement: "Finance",
            stageCount: 2,
            activeStageCount: 1,
            completionRate: 50,
            completionRateLabel: "50 %",
            averageProgress: 60,
            averageProgressLabel: "60 %",
            trackedReportsCount: 2,
          },
          {
            departement: "RH",
            stageCount: 1,
            activeStageCount: 1,
            completionRate: 0,
            completionRateLabel: "0 %",
            averageProgress: 30,
            averageProgressLabel: "30 %",
            trackedReportsCount: 1,
          },
        ],
        alerts: [],
        stageDetails: [
          {
            stageId: "stage-1",
            departement: "Finance",
            attentionLabel: "Critique",
          },
          {
            stageId: "stage-2",
            departement: "RH",
            attentionLabel: "Stable",
          },
        ],
        totals: {
          stageCount: 3,
          reportCount: 4,
          evaluationCount: 2,
          documentCount: 1,
        },
      },
      meta: {
        cached: true,
        generatedAt: "2026-04-15T10:00:00.000Z",
        cacheTtlSeconds: 60,
      },
    });
    buildDepartmentAnalyticsCsvMock.mockReturnValue("departments csv");

    const { GET } = await import("@/app/api/analytics/export/route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/analytics/export?period=weekly&mode=departments&department=Finance&attention=critical&limit=25",
      ),
    );
    const payload = await response.text();

    expect(response.status).toBe(200);
    expect(payload).toBe("departments csv");
    expect(response.headers.get("X-Analytics-Period")).toBe("7 derniers jours");
    expect(response.headers.get("X-Analytics-Export-Mode")).toBe("Detail departements");
    expect(response.headers.get("X-Analytics-Attention-Filter")).toBe("critical");
    expect(response.headers.get("X-Analytics-Department-Filter")).toBe("Finance");
    expect(buildDepartmentAnalyticsCsvMock).toHaveBeenCalledWith(
      expect.objectContaining({
        departments: [
          expect.objectContaining({
            departement: "Finance",
          }),
        ],
        stageDetails: [
          expect.objectContaining({
            departement: "Finance",
            attentionLabel: "Critique",
          }),
        ],
      }),
    );
    expect(recordPerformanceSampleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "analytics-export",
        cached: true,
      }),
    );
  });
});
