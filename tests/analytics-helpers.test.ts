import { describe, expect, it } from "vitest";
import {
  buildAnalyticsAlerts,
  buildAnalyticsCsv,
  buildDepartmentAnalytics,
  buildDepartmentAnalyticsCsv,
  buildDetailedAnalyticsCsv,
  buildStageAnalyticsDetails,
  buildStageAttentionSummary,
  calculateCompletionRate,
  calculateMedianDurationHours,
  filterDepartmentAnalytics,
  filterStageAnalyticsDetails,
  getAnalyticsDepartmentOptions,
  getAnalyticsRange,
  resolveAnalyticsAttentionFilter,
  resolveAnalyticsExportMode,
  resolveAnalyticsPeriod,
  resolveAnalyticsStageDetailLimit,
  type AnalyticsOverview,
} from "@/lib/analytics";

describe("analytics helpers", () => {
  it("resolves period, export mode, attention filters and detail limits", () => {
    expect(resolveAnalyticsPeriod("weekly")).toBe("weekly");
    expect(resolveAnalyticsPeriod("unknown")).toBe("monthly");
    expect(resolveAnalyticsExportMode("departments")).toBe("departments");
    expect(resolveAnalyticsExportMode("invalid")).toBe("overview");
    expect(resolveAnalyticsAttentionFilter("critical")).toBe("critical");
    expect(resolveAnalyticsAttentionFilter("invalid")).toBe("all");
    expect(resolveAnalyticsStageDetailLimit("25")).toBe(25);
    expect(resolveAnalyticsStageDetailLimit("999")).toBe(8);
  });

  it("calculates ranges, completion rates and median durations", () => {
    const range = getAnalyticsRange("weekly", new Date("2026-04-15T12:00:00.000Z"));

    expect(range.label).toBe("9 avril 2026 au 15 avril 2026");
    expect(calculateCompletionRate(3, 4)).toBe(75);
    expect(calculateCompletionRate(1, 0)).toBe(0);
    expect(
      calculateMedianDurationHours([
        {
          startedAt: new Date("2026-04-01T08:00:00.000Z"),
          endedAt: new Date("2026-04-02T08:00:00.000Z"),
        },
        {
          startedAt: new Date("2026-04-01T08:00:00.000Z"),
          endedAt: new Date("2026-04-03T08:00:00.000Z"),
        },
        {
          startedAt: new Date("2026-04-01T08:00:00.000Z"),
          endedAt: new Date("2026-04-04T08:00:00.000Z"),
        },
      ]),
    ).toBe(48);
  });

  it("builds department analytics and filters stage details", () => {
    const departments = buildDepartmentAnalytics(
      [
        {
          id: "stage-1",
          departement: "Finance",
          statut: "EN_COURS" as const,
          dateFin: new Date("2026-04-20T00:00:00.000Z"),
        },
        {
          id: "stage-2",
          departement: "Ingenierie",
          statut: "TERMINE" as const,
          dateFin: new Date("2026-04-24T00:00:00.000Z"),
        },
      ],
      new Map([
        [
          "stage-1",
          {
            stageId: "stage-1",
            avancement: 55,
            updatedAt: new Date("2026-04-12T00:00:00.000Z"),
            dateSoumission: new Date("2026-04-12T00:00:00.000Z"),
          },
        ],
        [
          "stage-2",
          {
            stageId: "stage-2",
            avancement: 80,
            updatedAt: new Date("2026-04-14T00:00:00.000Z"),
            dateSoumission: new Date("2026-04-14T00:00:00.000Z"),
          },
        ],
      ]),
    );

    expect(departments[0].departement).toBe("Ingenierie");
    expect(filterDepartmentAnalytics(departments, "Finance")).toHaveLength(1);
    expect(getAnalyticsDepartmentOptions(departments)).toEqual(["Finance", "Ingenierie"]);

    const stageDetails = buildStageAnalyticsDetails({
      stages: [
        {
          id: "stage-1",
          departement: "Finance",
          sujet: "Cloture mensuelle",
          statut: "EN_COURS" as const,
          dateFin: new Date("2026-04-20T00:00:00.000Z"),
          stagiaire: {
            user: {
              prenom: "Alice",
              nom: "Doe",
            },
          },
          encadrant: {
            prenom: "Nadia",
            nom: "Chef",
          },
        },
        {
          id: "stage-2",
          departement: "Ingenierie",
          sujet: "Portail RH",
          statut: "EN_COURS" as const,
          dateFin: new Date("2026-05-20T00:00:00.000Z"),
          stagiaire: {
            user: {
              prenom: "Bilal",
              nom: "Smith",
            },
          },
          encadrant: {
            prenom: "Yassine",
            nom: "Lead",
          },
        },
        {
          id: "stage-3",
          departement: "Support",
          sujet: "Base documentaire",
          statut: "TERMINE" as const,
          dateFin: new Date("2026-04-10T00:00:00.000Z"),
          stagiaire: {
            user: {
              prenom: "Sara",
              nom: "Lee",
            },
          },
          encadrant: null,
        },
      ],
      latestReportsByStage: new Map([
        [
          "stage-1",
          {
            stageId: "stage-1",
            avancement: 40,
            updatedAt: new Date("2026-04-01T00:00:00.000Z"),
            dateSoumission: new Date("2026-04-01T00:00:00.000Z"),
          },
        ],
        [
          "stage-2",
          {
            stageId: "stage-2",
            avancement: 70,
            updatedAt: new Date("2026-04-14T00:00:00.000Z"),
            dateSoumission: new Date("2026-04-14T00:00:00.000Z"),
          },
        ],
      ]),
      pendingReportsByStage: new Map([["stage-1", 1]]),
      pendingEvaluationsByStage: new Map([["stage-2", 1]]),
      documentAttentionByStage: new Map(),
      now: new Date("2026-04-15T00:00:00.000Z"),
    });

    expect(stageDetails[0].stageId).toBe("stage-1");
    expect(stageDetails[0].attentionLabel).toBe("Critique");
    expect(stageDetails[1].attentionLabel).toBe("Attention");
    expect(filterStageAnalyticsDetails(stageDetails, { attention: "warning" })).toHaveLength(1);
    expect(
      filterStageAnalyticsDetails(stageDetails, {
        department: "Finance",
        limit: 10,
      }),
    ).toHaveLength(1);
    expect(buildStageAttentionSummary(stageDetails)).toEqual([
      { key: "critical", label: "Critique", count: 1 },
      { key: "warning", label: "Attention", count: 1 },
      { key: "stable", label: "Stable", count: 1 },
    ]);
  });

  it("builds alerts and csv exports from a shared analytics overview", () => {
    const alerts = buildAnalyticsAlerts({
      reportMedianHours: 90,
      evaluationCompletionRate: 50,
      trackedEvaluationsCount: 5,
      documentMedianHours: 80,
      delayedStageCount: 2,
      pendingReportsCount: 1,
      pendingEvaluationsCount: 1,
      documentAttentionCount: 1,
    });

    expect(alerts[0].id).toBe("evaluation-completion-target");
    expect(alerts.at(-1)?.id).toBe("workflow-backlog");

    const overview: AnalyticsOverview = {
      period: "monthly",
      range: {
        start: new Date("2026-04-01T00:00:00.000Z"),
        end: new Date("2026-04-30T00:00:00.000Z"),
        label: "01 avr. 2026 au 30 avr. 2026",
      },
      scopeLabel: "pilotage global",
      metrics: [
        {
          key: "report-processing",
          label: "Traitement median des rapports",
          value: "48,0 h",
          helper: "Median entre soumission et decision",
        },
      ],
      focusItems: [
        {
          key: "pending-reports",
          label: "Rapports a relire",
          value: "2",
          helper: "Rapports actuellement soumis",
        },
      ],
      departments: [
        {
          departement: "Finance",
          stageCount: 2,
          activeStageCount: 1,
          completionRate: 50,
          completionRateLabel: "50 %",
          averageProgress: 55,
          averageProgressLabel: "55 %",
          trackedReportsCount: 2,
        },
      ],
      alerts,
      stageDetails: [
        {
          stageId: "stage-1",
          stagiaire: "Alice Doe",
          encadrant: "Nadia Chef",
          departement: "Finance",
          sujet: "Cloture mensuelle",
          stageStatus: "EN_COURS",
          stageStatusLabel: "En cours",
          latestProgress: 40,
          latestProgressLabel: "40 %",
          latestReportAt: new Date("2026-04-01T00:00:00.000Z"),
          latestReportAtLabel: "01 avr. 2026",
          pendingReportsCount: 1,
          pendingEvaluationsCount: 0,
          documentAttentionCount: 0,
          daysUntilEnd: 5,
          daysUntilEndLabel: "J-5",
          attentionScore: 7,
          attentionLabel: "Critique",
        },
      ],
      totals: {
        stageCount: 2,
        reportCount: 3,
        evaluationCount: 5,
        documentCount: 1,
      },
    };

    const overviewCsv = buildAnalyticsCsv(overview);
    const detailedCsv = buildDetailedAnalyticsCsv(overview);
    const departmentsCsv = buildDepartmentAnalyticsCsv(overview);

    expect(overviewCsv.startsWith("\uFEFF")).toBe(true);
    expect(overviewCsv).toContain("Traitement median des rapports");
    expect(detailedCsv).toContain("Alice Doe");
    expect(detailedCsv).toContain("Critique");
    expect(departmentsCsv).toContain("Finance");
    expect(departmentsCsv).toContain("55 %");
  });
});
