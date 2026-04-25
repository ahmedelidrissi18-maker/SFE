import {
  EvaluationStatus,
  type Prisma,
  type Role,
  type RapportStatus,
  type StageStatus,
} from "@prisma/client";
import { formatDateFr } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { recordPerformanceSample } from "@/lib/observability";
import { getStageStatusLabel, ACTIVE_STAGE_STATUSES } from "@/lib/stages";

export const analyticsPeriodDefinitions = {
  weekly: {
    label: "7 derniers jours",
    shortLabel: "Hebdo",
    days: 7,
  },
  monthly: {
    label: "30 derniers jours",
    shortLabel: "Mensuel",
    days: 30,
  },
  quarterly: {
    label: "90 derniers jours",
    shortLabel: "Trimestriel",
    days: 90,
  },
} as const;

export const analyticsExportModeDefinitions = {
  overview: {
    label: "KPI",
  },
  detailed: {
    label: "Détail stages",
  },
  departments: {
    label: "Détail départements",
  },
} as const;

export const analyticsAttentionFilterDefinitions = {
  all: {
    label: "Toutes",
    helper: "Toutes les vigilances",
  },
  critical: {
    label: "Critique",
    helper: "Seulement les stages critiques",
  },
  warning: {
    label: "Attention",
    helper: "Seulement les stages à surveiller",
  },
  stable: {
    label: "Stable",
    helper: "Seulement les stages stables",
  },
} as const;

export const analyticsTargetDefinitions = {
  reportProcessingHours: 72,
  evaluationCompletionRate: 80,
  documentValidationHours: 48,
  inactivityDays: 7,
} as const;

const ANALYTICS_CACHE_TTL_MS = 60 * 1000;
export const analyticsStageDetailLimitOptions = [8, 15, 25, 50] as const;

export type AnalyticsPeriod = keyof typeof analyticsPeriodDefinitions;
export type AnalyticsExportMode = keyof typeof analyticsExportModeDefinitions;
export type AnalyticsAttentionFilter = keyof typeof analyticsAttentionFilterDefinitions;
export type AnalyticsAlertSeverity = "critical" | "warning" | "info";
export type AnalyticsStageDetailLimit = (typeof analyticsStageDetailLimitOptions)[number];

export type AnalyticsRange = {
  start: Date;
  end: Date;
  label: string;
};

export type AnalyticsMetric = {
  key: string;
  label: string;
  value: string;
  helper: string;
};

export type AnalyticsFocusItem = {
  key: string;
  label: string;
  value: string;
  helper: string;
};

export type DepartmentAnalyticsRow = {
  departement: string;
  stageCount: number;
  activeStageCount: number;
  completionRate: number;
  completionRateLabel: string;
  averageProgress: number | null;
  averageProgressLabel: string;
  trackedReportsCount: number;
};

export type AnalyticsAlert = {
  id: string;
  severity: AnalyticsAlertSeverity;
  title: string;
  description: string;
};

export type StageAnalyticsDetailRow = {
  stageId: string;
  stagiaire: string;
  encadrant: string;
  departement: string;
  sujet: string;
  stageStatus: StageStatus;
  stageStatusLabel: string;
  latestProgress: number | null;
  latestProgressLabel: string;
  latestReportAt: Date | null;
  latestReportAtLabel: string;
  pendingReportsCount: number;
  pendingEvaluationsCount: number;
  documentAttentionCount: number;
  daysUntilEnd: number;
  daysUntilEndLabel: string;
  attentionScore: number;
  attentionLabel: string;
};

export type AnalyticsOverview = {
  period: AnalyticsPeriod;
  range: AnalyticsRange;
  scopeLabel: string;
  metrics: AnalyticsMetric[];
  focusItems: AnalyticsFocusItem[];
  departments: DepartmentAnalyticsRow[];
  alerts: AnalyticsAlert[];
  stageDetails: StageAnalyticsDetailRow[];
  totals: {
    stageCount: number;
    reportCount: number;
    evaluationCount: number;
    documentCount: number;
  };
};

export type AnalyticsOverviewMeta = {
  cached: boolean;
  generatedAt: string;
  cacheTtlSeconds: number;
};

export type AnalyticsStageDetailsFilters = {
  attention?: AnalyticsAttentionFilter;
  department?: string | null;
  limit?: number;
};

export type StageAttentionSummaryRow = {
  key: Exclude<AnalyticsAttentionFilter, "all">;
  label: string;
  count: number;
};

type StageSummary = {
  id: string;
  departement: string;
  sujet: string;
  statut: StageStatus;
  dateFin: Date;
  stagiaire: {
    user: {
      nom: string;
      prenom: string;
    };
  };
  encadrant: {
    nom: string;
    prenom: string;
  } | null;
};

type ReportSnapshot = {
  stageId: string;
  statut?: RapportStatus;
  avancement: number;
  updatedAt: Date;
  dateSoumission: Date | null;
};

type TimedLifecycleRecord = {
  startedAt: Date | null;
  endedAt: Date | null;
};

type GroupedStageCount = {
  stageId: string;
  _count?:
    | {
        _all?: number;
      }
    | true;
};

type AnalyticsOverviewCacheEntry = {
  overview: AnalyticsOverview;
  generatedAt: string;
  expiresAt: number;
};

declare global {
  var __sfeAnalyticsOverviewCache__:
    | Map<string, AnalyticsOverviewCacheEntry>
    | undefined;
}

function getAnalyticsOverviewCache() {
  if (!globalThis.__sfeAnalyticsOverviewCache__) {
    globalThis.__sfeAnalyticsOverviewCache__ = new Map();
  }

  return globalThis.__sfeAnalyticsOverviewCache__;
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits > 0 ? 1 : 0,
  }).format(value);
}

function formatHours(value: number) {
  return `${formatNumber(value, 1)} h`;
}

function formatDayDistance(value: number) {
  if (value === 0) {
    return "Échéance aujourd’hui";
  }

  if (value < 0) {
    return `${formatNumber(Math.abs(value))} j de dépassement`;
  }

  return `J-${formatNumber(value)}`;
}

function getAlertSeverityRank(severity: AnalyticsAlertSeverity) {
  const ranks: Record<AnalyticsAlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return ranks[severity];
}

function getStageAttentionLabel(score: number) {
  if (score >= 6) {
    return "Critique";
  }

  if (score >= 3) {
    return "Attention";
  }

  return "Stable";
}

function getFullName(person?: { prenom: string; nom: string } | null) {
  if (!person) {
    return "Non affecté";
  }

  return `${person.prenom} ${person.nom}`.trim();
}

function calculateDaysUntilEnd(dateFin: Date, now = new Date()) {
  const today = new Date(now);
  const target = new Date(dateFin);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function buildStageCountMap(rows: GroupedStageCount[]) {
  return new Map(
    rows.map((row) => [
      row.stageId,
      typeof row._count === "object" && row._count ? row._count._all ?? 0 : 0,
    ]),
  );
}

export function canAccessAnalytics(role: Role) {
  return role === "ADMIN" || role === "RH" || role === "ENCADRANT";
}

export function getAnalyticsScopeLabel(role: Role) {
  if (role === "ADMIN") {
    return "pilotage global";
  }

  if (role === "RH") {
    return "pilotage RH";
  }

  if (role === "ENCADRANT") {
    return "votre périmètre d’encadrement";
  }

  return "votre périmètre";
}

export function resolveAnalyticsPeriod(value?: string | null): AnalyticsPeriod {
  if (!value) {
    return "monthly";
  }

  return value in analyticsPeriodDefinitions ? (value as AnalyticsPeriod) : "monthly";
}

export function resolveAnalyticsExportMode(value?: string | null): AnalyticsExportMode {
  if (!value) {
    return "overview";
  }

  return value in analyticsExportModeDefinitions
    ? (value as AnalyticsExportMode)
    : "overview";
}

export function resolveAnalyticsAttentionFilter(value?: string | null): AnalyticsAttentionFilter {
  if (!value) {
    return "all";
  }

  return value in analyticsAttentionFilterDefinitions
    ? (value as AnalyticsAttentionFilter)
    : "all";
}

export function resolveAnalyticsStageDetailLimit(value?: string | null): AnalyticsStageDetailLimit {
  if (!value) {
    return analyticsStageDetailLimitOptions[0];
  }

  const parsedValue = Number.parseInt(value, 10);

  return analyticsStageDetailLimitOptions.find((option) => option === parsedValue)
    ?? analyticsStageDetailLimitOptions[0];
}

export function getAnalyticsPeriodOptions() {
  return Object.entries(analyticsPeriodDefinitions).map(([value, definition]) => ({
    value: value as AnalyticsPeriod,
    label: definition.shortLabel,
    helper: definition.label,
  }));
}

export function getAnalyticsAttentionFilterOptions() {
  return Object.entries(analyticsAttentionFilterDefinitions).map(([value, definition]) => ({
    value: value as AnalyticsAttentionFilter,
    label: definition.label,
    helper: definition.helper,
  }));
}

export function getAnalyticsStageDetailLimitOptions() {
  return analyticsStageDetailLimitOptions.map((value) => ({
    value,
    label: `${value} lignes`,
  }));
}

export function getAnalyticsRange(period: AnalyticsPeriod, now = new Date()): AnalyticsRange {
  const definition = analyticsPeriodDefinitions[period];
  const end = new Date(now);
  const start = new Date(now);

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (definition.days - 1));

  return {
    start,
    end,
    label: `${formatDateFr(start)} au ${formatDateFr(end)}`,
  };
}

function getStageScope(role: Role, userId: string): Prisma.StageWhereInput {
  if (role === "ENCADRANT") {
    return {
      encadrantId: userId,
    };
  }

  if (role === "STAGIAIRE") {
    return {
      stagiaire: {
        userId,
      },
    };
  }

  return {};
}

export function calculateCompletionRate(completed: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

export function calculateMedianDurationHours(records: TimedLifecycleRecord[]) {
  const durations = records
    .flatMap((record) => {
      if (!record.startedAt || !record.endedAt) {
        return [];
      }

      const durationMs = record.endedAt.getTime() - record.startedAt.getTime();

      if (durationMs < 0) {
        return [];
      }

      return [durationMs / (1000 * 60 * 60)];
    })
    .sort((left, right) => left - right);

  if (durations.length === 0) {
    return null;
  }

  const middleIndex = Math.floor(durations.length / 2);

  if (durations.length % 2 === 1) {
    return durations[middleIndex];
  }

  return (durations[middleIndex - 1] + durations[middleIndex]) / 2;
}

export function formatDurationHours(value: number | null) {
  if (value === null) {
    return "Aucune";
  }

  return `${formatNumber(value, 1)} h`;
}

export function formatPercentage(value: number) {
  return `${formatNumber(value)} %`;
}

function buildLatestReportMap(reports: ReportSnapshot[]) {
  const latestByStage = new Map<string, ReportSnapshot>();

  for (const report of reports) {
    if (!latestByStage.has(report.stageId)) {
      latestByStage.set(report.stageId, report);
    }
  }

  return latestByStage;
}

export function buildDepartmentAnalytics(
  stages: Array<Pick<StageSummary, "id" | "departement" | "statut" | "dateFin">>,
  latestReportsByStage: Map<string, ReportSnapshot>,
) {
  const rows = new Map<
    string,
    {
      departement: string;
      stageCount: number;
      activeStageCount: number;
      completedStageCount: number;
      progressTotal: number;
      trackedReportsCount: number;
    }
  >();

  for (const stage of stages) {
    const existing = rows.get(stage.departement) ?? {
      departement: stage.departement,
      stageCount: 0,
      activeStageCount: 0,
      completedStageCount: 0,
      progressTotal: 0,
      trackedReportsCount: 0,
    };

    existing.stageCount += 1;

    if (ACTIVE_STAGE_STATUSES.includes(stage.statut)) {
      existing.activeStageCount += 1;
    }

    if (stage.statut === "TERMINE") {
      existing.completedStageCount += 1;
    }

    const latestReport = latestReportsByStage.get(stage.id);

    if (latestReport) {
      existing.progressTotal += latestReport.avancement;
      existing.trackedReportsCount += 1;
    }

    rows.set(stage.departement, existing);
  }

  return [...rows.values()]
    .map((row) => {
      const averageProgress =
        row.trackedReportsCount > 0 ? Math.round(row.progressTotal / row.trackedReportsCount) : null;
      const completionRate = calculateCompletionRate(row.completedStageCount, row.stageCount);

      return {
        departement: row.departement,
        stageCount: row.stageCount,
        activeStageCount: row.activeStageCount,
        completionRate,
        completionRateLabel: formatPercentage(completionRate),
        averageProgress,
        averageProgressLabel: averageProgress === null ? "Aucune donnée" : formatPercentage(averageProgress),
        trackedReportsCount: row.trackedReportsCount,
      };
    })
    .sort((left, right) => {
      const progressDelta = (right.averageProgress ?? -1) - (left.averageProgress ?? -1);

      if (progressDelta !== 0) {
        return progressDelta;
      }

      return left.departement.localeCompare(right.departement, "fr");
    });
}

export function countPotentialSubmissionDelays(
  activeStages: Array<{ id: string }>,
  latestReportsByStage: Map<string, { updatedAt: Date; dateSoumission: Date | null }>,
  now = new Date(),
) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - analyticsTargetDefinitions.inactivityDays);

  return activeStages.filter((stage) => {
    const latestReport = latestReportsByStage.get(stage.id);
    const latestVisibleActivity = latestReport?.dateSoumission ?? latestReport?.updatedAt;

    return !latestVisibleActivity || latestVisibleActivity < cutoff;
  }).length;
}

export function buildAnalyticsAlerts(input: {
  reportMedianHours: number | null;
  evaluationCompletionRate: number;
  trackedEvaluationsCount: number;
  documentMedianHours: number | null;
  delayedStageCount: number;
  pendingReportsCount: number;
  pendingEvaluationsCount: number;
  documentAttentionCount: number;
}) {
  const alerts: AnalyticsAlert[] = [];

  if (
    input.reportMedianHours !== null &&
    input.reportMedianHours > analyticsTargetDefinitions.reportProcessingHours
  ) {
    alerts.push({
      id: "report-processing-sla",
      severity:
        input.reportMedianHours > analyticsTargetDefinitions.reportProcessingHours * 1.5
          ? "critical"
          : "warning",
      title: "Traitement des rapports au-dessus de la cible",
      description: `Médiane observée à ${formatHours(input.reportMedianHours)} pour une cible de ${formatNumber(analyticsTargetDefinitions.reportProcessingHours)} h.`,
    });
  }

  if (
    input.trackedEvaluationsCount > 0 &&
    input.evaluationCompletionRate < analyticsTargetDefinitions.evaluationCompletionRate
  ) {
    alerts.push({
      id: "evaluation-completion-target",
      severity: input.evaluationCompletionRate < 60 ? "critical" : "warning",
      title: "Complétion des évaluations en dessous de l’objectif",
      description: `${formatPercentage(input.evaluationCompletionRate)} réalisé sur une cible de ${formatPercentage(analyticsTargetDefinitions.evaluationCompletionRate)}.`,
    });
  }

  if (
    input.documentMedianHours !== null &&
    input.documentMedianHours > analyticsTargetDefinitions.documentValidationHours
  ) {
    alerts.push({
      id: "document-validation-sla",
      severity:
        input.documentMedianHours > analyticsTargetDefinitions.documentValidationHours * 1.5
          ? "critical"
          : "warning",
      title: "Validation documentaire trop lente",
      description: `Médiane observée à ${formatHours(input.documentMedianHours)} pour une cible de ${formatNumber(analyticsTargetDefinitions.documentValidationHours)} h.`,
    });
  }

  if (input.delayedStageCount > 0) {
    alerts.push({
      id: "stage-activity-delay",
      severity: input.delayedStageCount >= 3 ? "critical" : "warning",
      title: "Stages sans activité récente",
      description: `${formatNumber(input.delayedStageCount)} stage${input.delayedStageCount > 1 ? "s" : ""} actif${input.delayedStageCount > 1 ? "s" : ""} sans rapport visible depuis ${analyticsTargetDefinitions.inactivityDays} jours.`,
    });
  }

  const pendingBacklog =
    input.pendingReportsCount + input.pendingEvaluationsCount + input.documentAttentionCount;

  if (pendingBacklog > 0) {
    alerts.push({
      id: "workflow-backlog",
      severity: pendingBacklog >= 8 ? "warning" : "info",
      title: "Backlog de traitement à surveiller",
      description: `${formatNumber(input.pendingReportsCount)} rapport${input.pendingReportsCount > 1 ? "s" : ""}, ${formatNumber(input.pendingEvaluationsCount)} évaluation${input.pendingEvaluationsCount > 1 ? "s" : ""} et ${formatNumber(input.documentAttentionCount)} document${input.documentAttentionCount > 1 ? "s" : ""} en attente d’action.`,
    });
  }

  return alerts.sort((left, right) => {
    return getAlertSeverityRank(left.severity) - getAlertSeverityRank(right.severity);
  });
}

export function getAnalyticsDepartmentOptions(departments: DepartmentAnalyticsRow[]) {
  return [...new Set(departments.map((department) => department.departement))]
    .sort((left, right) => left.localeCompare(right, "fr"));
}

export function resolveAnalyticsDepartmentFilter(
  value: string | null | undefined,
  departments: DepartmentAnalyticsRow[],
) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  return departments.some((department) => department.departement === normalizedValue)
    ? normalizedValue
    : null;
}

export function filterDepartmentAnalytics(
  departments: DepartmentAnalyticsRow[],
  department?: string | null,
) {
  if (!department) {
    return departments;
  }

  return departments.filter((row) => row.departement === department);
}

function matchesStageAttentionFilter(
  stage: Pick<StageAnalyticsDetailRow, "attentionLabel">,
  filter: AnalyticsAttentionFilter,
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "critical") {
    return stage.attentionLabel === "Critique";
  }

  if (filter === "warning") {
    return stage.attentionLabel === "Attention";
  }

  return stage.attentionLabel === "Stable";
}

export function filterStageAnalyticsDetails(
  stages: StageAnalyticsDetailRow[],
  filters: AnalyticsStageDetailsFilters = {},
) {
  const attentionFilter = filters.attention ?? "all";
  const departmentFilter = filters.department?.trim() ?? "";
  const filteredStages = stages.filter((stage) => {
    const matchesAttention = matchesStageAttentionFilter(stage, attentionFilter);
    const matchesDepartment = departmentFilter ? stage.departement === departmentFilter : true;

    return matchesAttention && matchesDepartment;
  });

  if (!filters.limit || filters.limit <= 0) {
    return filteredStages;
  }

  return filteredStages.slice(0, filters.limit);
}

export function buildStageAttentionSummary(stages: StageAnalyticsDetailRow[]): StageAttentionSummaryRow[] {
  return [
    {
      key: "critical",
      label: analyticsAttentionFilterDefinitions.critical.label,
      count: stages.filter((stage) => stage.attentionLabel === "Critique").length,
    },
    {
      key: "warning",
      label: analyticsAttentionFilterDefinitions.warning.label,
      count: stages.filter((stage) => stage.attentionLabel === "Attention").length,
    },
    {
      key: "stable",
      label: analyticsAttentionFilterDefinitions.stable.label,
      count: stages.filter((stage) => stage.attentionLabel === "Stable").length,
    },
  ];
}

export function buildStageAnalyticsDetails(input: {
  stages: StageSummary[];
  latestReportsByStage: Map<string, ReportSnapshot>;
  pendingReportsByStage: Map<string, number>;
  pendingEvaluationsByStage: Map<string, number>;
  documentAttentionByStage: Map<string, number>;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const inactivityCutoff = new Date(now);
  inactivityCutoff.setDate(inactivityCutoff.getDate() - analyticsTargetDefinitions.inactivityDays);

  return input.stages
    .map((stage) => {
      const latestReport = input.latestReportsByStage.get(stage.id) ?? null;
      const pendingReportsCount = input.pendingReportsByStage.get(stage.id) ?? 0;
      const pendingEvaluationsCount = input.pendingEvaluationsByStage.get(stage.id) ?? 0;
      const documentAttentionCount = input.documentAttentionByStage.get(stage.id) ?? 0;
      const latestVisibleActivity = latestReport?.dateSoumission ?? latestReport?.updatedAt ?? null;
      const daysUntilEnd = calculateDaysUntilEnd(stage.dateFin, now);
      const isDelayed =
        ACTIVE_STAGE_STATUSES.includes(stage.statut) &&
        (!latestVisibleActivity || latestVisibleActivity < inactivityCutoff);

      let attentionScore = 0;

      if (isDelayed) {
        attentionScore += 4;
      }

      if (stage.statut === "SUSPENDU") {
        attentionScore += 2;
      }

      if (pendingReportsCount > 0) {
        attentionScore += 2;
      }

      if (pendingEvaluationsCount > 0) {
        attentionScore += 3;
      }

      if (documentAttentionCount > 0) {
        attentionScore += 2;
      }

      if (ACTIVE_STAGE_STATUSES.includes(stage.statut) && daysUntilEnd <= 7) {
        attentionScore += 1;
      }

      return {
        stageId: stage.id,
        stagiaire: getFullName(stage.stagiaire.user),
        encadrant: getFullName(stage.encadrant),
        departement: stage.departement,
        sujet: stage.sujet,
        stageStatus: stage.statut,
        stageStatusLabel: getStageStatusLabel(stage.statut),
        latestProgress: latestReport?.avancement ?? null,
        latestProgressLabel:
          latestReport?.avancement === undefined
            ? "Aucun rapport"
            : formatPercentage(latestReport.avancement),
        latestReportAt: latestVisibleActivity,
        latestReportAtLabel: latestVisibleActivity ? formatDateFr(latestVisibleActivity) : "Aucune",
        pendingReportsCount,
        pendingEvaluationsCount,
        documentAttentionCount,
        daysUntilEnd,
        daysUntilEndLabel: formatDayDistance(daysUntilEnd),
        attentionScore,
        attentionLabel: getStageAttentionLabel(attentionScore),
      } satisfies StageAnalyticsDetailRow;
    })
    .sort((left, right) => {
      if (right.attentionScore !== left.attentionScore) {
        return right.attentionScore - left.attentionScore;
      }

      if (left.daysUntilEnd !== right.daysUntilEnd) {
        return left.daysUntilEnd - right.daysUntilEnd;
      }

      return left.stagiaire.localeCompare(right.stagiaire, "fr");
    });
}

async function buildAnalyticsOverview(input: {
  role: Role;
  userId: string;
  period: AnalyticsPeriod;
  now?: Date;
}) {
  const { role, userId, period } = input;
  const now = input.now ?? new Date();
  const range = getAnalyticsRange(period, now);
  const stageScope = getStageScope(role, userId);

  const [
    stagesInPeriod,
    endingStagesCountInPeriod,
    completedEndingStagesCountInPeriod,
    activeStagesNow,
    processedRapports,
    currentPendingRapportsCount,
    pendingReportsByStage,
    latestReportsInPeriod,
    latestReportsForVisibleStages,
    trackedEvaluationsByStatus,
    currentPendingEvaluationsCount,
    pendingEvaluationsByStage,
    validatedDocuments,
    currentPendingDocumentsCount,
    currentRejectedDocumentsCount,
    documentAttentionByStage,
  ] = await prisma.$transaction([
    prisma.stage.findMany({
      where: {
        ...stageScope,
        statut: {
          not: "ANNULE",
        },
        dateDebut: {
          lte: range.end,
        },
        dateFin: {
          gte: range.start,
        },
      },
      select: {
        id: true,
        departement: true,
        sujet: true,
        statut: true,
        dateFin: true,
        stagiaire: {
          select: {
            user: {
              select: {
                nom: true,
                prenom: true,
              },
            },
          },
        },
        encadrant: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    }),
    prisma.stage.count({
      where: {
        ...stageScope,
        statut: {
          not: "ANNULE",
        },
        dateFin: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
    prisma.stage.count({
      where: {
        ...stageScope,
        statut: "TERMINE",
        dateFin: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
    prisma.stage.findMany({
      where: {
        ...stageScope,
        statut: {
          in: ACTIVE_STAGE_STATUSES,
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.rapport.findMany({
      where: {
        stage: stageScope,
        dateSoumission: {
          gte: range.start,
          lte: range.end,
        },
        statut: {
          in: ["VALIDE", "RETOURNE"],
        },
      },
      select: {
        dateSoumission: true,
        updatedAt: true,
      },
    }),
    prisma.rapport.count({
      where: {
        stage: stageScope,
        statut: "SOUMIS",
      },
    }),
    prisma.rapport.groupBy({
      by: ["stageId"],
      where: {
        stage: stageScope,
        statut: "SOUMIS",
      },
      orderBy: {
        stageId: "asc",
      },
      _count: {
        _all: true,
      },
    }),
    prisma.rapport.findMany({
      where: {
        stage: {
          ...stageScope,
          statut: {
            not: "ANNULE",
          },
          dateDebut: {
            lte: range.end,
          },
          dateFin: {
            gte: range.start,
          },
        },
        updatedAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        stageId: true,
        avancement: true,
        updatedAt: true,
        dateSoumission: true,
      },
      orderBy: [{ stageId: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.rapport.findMany({
      where: {
        stage: {
          ...stageScope,
          statut: {
            not: "ANNULE",
          },
          dateDebut: {
            lte: range.end,
          },
          dateFin: {
            gte: range.start,
          },
        },
      },
      select: {
        stageId: true,
        statut: true,
        avancement: true,
        updatedAt: true,
        dateSoumission: true,
      },
      orderBy: [{ stageId: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.evaluation.groupBy({
      by: ["status"],
      where: {
        stage: stageScope,
        OR: [
          {
            scheduledFor: {
              gte: range.start,
              lte: range.end,
            },
          },
          {
            scheduledFor: null,
            createdAt: {
              gte: range.start,
              lte: range.end,
            },
          },
        ],
      },
      orderBy: {
        status: "asc",
      },
      _count: {
        _all: true,
      },
    }),
    prisma.evaluation.count({
      where: {
        stage: stageScope,
        status: EvaluationStatus.SOUMIS,
      },
    }),
    prisma.evaluation.groupBy({
      by: ["stageId"],
      where: {
        stage: stageScope,
        status: EvaluationStatus.SOUMIS,
      },
      orderBy: {
        stageId: "asc",
      },
      _count: {
        _all: true,
      },
    }),
    prisma.document.findMany({
      where: {
        stage: stageScope,
        isDeleted: false,
        statut: "VALIDE",
        validatedAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        createdAt: true,
        validatedAt: true,
      },
    }),
    prisma.document.count({
      where: {
        stage: stageScope,
        isDeleted: false,
        statut: "EN_VERIFICATION",
      },
    }),
    prisma.document.count({
      where: {
        stage: stageScope,
        isDeleted: false,
        statut: "REJETE",
      },
    }),
    prisma.document.groupBy({
      by: ["stageId"],
      where: {
        stage: stageScope,
        isDeleted: false,
        statut: {
          in: ["EN_VERIFICATION", "REJETE"],
        },
      },
      orderBy: {
        stageId: "asc",
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const latestReportsByStage = buildLatestReportMap(latestReportsInPeriod);
  const latestDetailedReportsByStage = buildLatestReportMap(latestReportsForVisibleStages);
  const pendingReportsByStageMap = buildStageCountMap(pendingReportsByStage);
  const pendingEvaluationsByStageMap = buildStageCountMap(pendingEvaluationsByStage);
  const documentAttentionByStageMap = buildStageCountMap(documentAttentionByStage);
  const getGroupedAllCount = (row: { _count?: true | { _all?: number | null } }) =>
    typeof row._count === "object" && row._count ? row._count._all ?? 0 : 0;
  const trackedEvaluationsCount = trackedEvaluationsByStatus.reduce(
    (total, row) => total + getGroupedAllCount(row),
    0,
  );
  const validatedEvaluationsCount = trackedEvaluationsByStatus
    .filter((row) => row.status === EvaluationStatus.VALIDE)
    .reduce((total, row) => total + getGroupedAllCount(row), 0);

  const reportMedianHours = calculateMedianDurationHours(
    processedRapports.map((rapport) => ({
      startedAt: rapport.dateSoumission,
      endedAt: rapport.updatedAt,
    })),
  );
  const evaluationCompletionRate = calculateCompletionRate(
    validatedEvaluationsCount,
    trackedEvaluationsCount,
  );
  const documentMedianHours = calculateMedianDurationHours(
    validatedDocuments.map((document) => ({
      startedAt: document.createdAt,
      endedAt: document.validatedAt,
    })),
  );
  const stageCompletionRate = calculateCompletionRate(
    completedEndingStagesCountInPeriod,
    endingStagesCountInPeriod,
  );
  const delayedStageCount = countPotentialSubmissionDelays(
    activeStagesNow,
    latestDetailedReportsByStage,
    now,
  );
  const departments = buildDepartmentAnalytics(stagesInPeriod, latestReportsByStage);
  const documentAttentionCount = currentPendingDocumentsCount + currentRejectedDocumentsCount;
  const alerts = buildAnalyticsAlerts({
    reportMedianHours,
    evaluationCompletionRate,
    trackedEvaluationsCount,
    documentMedianHours,
    delayedStageCount,
    pendingReportsCount: currentPendingRapportsCount,
    pendingEvaluationsCount: currentPendingEvaluationsCount,
    documentAttentionCount,
  });
  const stageDetails = buildStageAnalyticsDetails({
    stages: stagesInPeriod,
    latestReportsByStage: latestDetailedReportsByStage,
    pendingReportsByStage: pendingReportsByStageMap,
    pendingEvaluationsByStage: pendingEvaluationsByStageMap,
    documentAttentionByStage: documentAttentionByStageMap,
    now,
  });

  return {
    period,
    range,
    scopeLabel: getAnalyticsScopeLabel(role),
    metrics: [
      {
        key: "report-processing",
        label: "Traitement médian des rapports",
        value: formatDurationHours(reportMedianHours),
        helper: "Médiane entre soumission et première décision sur la période",
      },
      {
        key: "evaluation-completion",
        label: "Complétion des évaluations",
        value: formatPercentage(evaluationCompletionRate),
        helper: "Évaluations validées parmi celles planifiées ou créées sur la période",
      },
      {
        key: "document-validation",
        label: "Validation documentaire",
        value: formatDurationHours(documentMedianHours),
        helper: "Médiane entre dépôt et validation finale des documents validés",
      },
      {
        key: "stage-completion",
        label: "Complétion des stages",
        value: formatPercentage(stageCompletionRate),
        helper: "Stages terminés parmi les stages prévus à échéance sur la période",
      },
    ],
    focusItems: [
      {
        key: "pending-reports",
        label: "Rapports à relire",
        value: formatNumber(currentPendingRapportsCount),
        helper: "Rapports actuellement soumis et encore en attente de décision",
      },
      {
        key: "potential-delays",
        label: "Retards potentiels",
        value: formatNumber(delayedStageCount),
        helper: "Stages actifs sans rapport visible depuis 7 jours",
      },
      {
        key: "pending-evaluations",
        label: "Évaluations à valider",
        value: formatNumber(currentPendingEvaluationsCount),
        helper: "Évaluations soumises qui attendent un retour RH ou admin",
      },
      {
        key: "document-review",
        label: "Documents en revue",
        value: formatNumber(documentAttentionCount),
        helper: "Documents en vérification ou rejetés avec action attendue",
      },
    ],
    departments,
    alerts,
    stageDetails,
    totals: {
      stageCount: stagesInPeriod.length,
      reportCount: processedRapports.length,
      evaluationCount: trackedEvaluationsCount,
      documentCount: validatedDocuments.length,
    },
  } satisfies AnalyticsOverview;
}

export async function getAnalyticsOverviewWithMeta(input: {
  role: Role;
  userId: string;
  period: AnalyticsPeriod;
  now?: Date;
  trackPerformance?: boolean;
}) {
  const startedAt = input.trackPerformance ? Date.now() : null;
  const useCache = !input.now;

  try {
    if (useCache) {
      const cacheKey = `${input.role}:${input.userId}:${input.period}`;
      const cache = getAnalyticsOverviewCache();
      const cachedEntry = cache.get(cacheKey);

      if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
        const result = {
          overview: cachedEntry.overview,
          meta: {
            cached: true,
            generatedAt: cachedEntry.generatedAt,
            cacheTtlSeconds: ANALYTICS_CACHE_TTL_MS / 1000,
          } satisfies AnalyticsOverviewMeta,
        };

        if (startedAt !== null) {
          recordPerformanceSample({
            scope: "analytics-overview",
            durationMs: Date.now() - startedAt,
            cached: true,
            detail: `role=${input.role};period=${input.period}`,
          });
        }

        return result;
      }

      const overview = await buildAnalyticsOverview(input);
      const generatedAt = new Date().toISOString();

      cache.set(cacheKey, {
        overview,
        generatedAt,
        expiresAt: Date.now() + ANALYTICS_CACHE_TTL_MS,
      });

      const result = {
        overview,
        meta: {
          cached: false,
          generatedAt,
          cacheTtlSeconds: ANALYTICS_CACHE_TTL_MS / 1000,
        } satisfies AnalyticsOverviewMeta,
      };

      if (startedAt !== null) {
        recordPerformanceSample({
          scope: "analytics-overview",
          durationMs: Date.now() - startedAt,
          cached: false,
          detail: `role=${input.role};period=${input.period}`,
        });
      }

      return result;
    }

    const overview = await buildAnalyticsOverview(input);
    const result = {
      overview,
      meta: {
        cached: false,
        generatedAt: new Date().toISOString(),
        cacheTtlSeconds: ANALYTICS_CACHE_TTL_MS / 1000,
      } satisfies AnalyticsOverviewMeta,
    };

    if (startedAt !== null) {
      recordPerformanceSample({
        scope: "analytics-overview",
        durationMs: Date.now() - startedAt,
        cached: false,
        detail: `role=${input.role};period=${input.period}`,
      });
    }

    return result;
  } catch (error) {
    if (startedAt !== null) {
      recordPerformanceSample({
        scope: "analytics-overview",
        durationMs: Date.now() - startedAt,
        ok: false,
        detail: error instanceof Error ? error.message : "unknown",
      });
    }

    throw error;
  }
}

export async function getAnalyticsOverview(input: {
  role: Role;
  userId: string;
  period: AnalyticsPeriod;
  now?: Date;
}) {
  const result = await getAnalyticsOverviewWithMeta(input);

  return result.overview;
}

function escapeCsvValue(value: string | number) {
  const normalized = String(value);

  if (!/[;"\n]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replaceAll('"', '""')}"`;
}

export function buildAnalyticsCsv(overview: AnalyticsOverview) {
  const lines = [
    ["section", "label", "value", "periode", "fenetre", "scope"],
    ...overview.metrics.map((metric) => [
      "kpi",
      metric.label,
      metric.value,
      analyticsPeriodDefinitions[overview.period].label,
      overview.range.label,
      overview.scopeLabel,
    ]),
    ...overview.focusItems.map((item) => [
      "focus",
      item.label,
      item.value,
      analyticsPeriodDefinitions[overview.period].label,
      overview.range.label,
      overview.scopeLabel,
    ]),
    ...overview.departments.map((department) => [
      "departement",
      department.departement,
      department.averageProgressLabel,
      analyticsPeriodDefinitions[overview.period].label,
      overview.range.label,
      `stages=${department.stageCount};actifs=${department.activeStageCount};completion=${department.completionRateLabel}`,
    ]),
  ];

  return `\uFEFF${lines
    .map((line) => line.map((value) => escapeCsvValue(value)).join(";"))
    .join("\n")}`;
}

export function buildDetailedAnalyticsCsv(overview: AnalyticsOverview) {
  const lines = [
    [
      "section",
      "stageId",
      "stagiaire",
      "encadrant",
      "departement",
      "sujet",
      "statut",
      "progression",
      "dernierRapport",
      "rapportsEnAttente",
      "evaluationsEnAttente",
      "documentsARevoir",
      "echeance",
      "vigilance",
      "periode",
      "fenetre",
      "scope",
    ],
    ...overview.alerts.map((alert) => [
      "alerte",
      alert.id,
      alert.title,
      alert.severity,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      alert.description,
      analyticsPeriodDefinitions[overview.period].label,
      overview.range.label,
      overview.scopeLabel,
    ]),
    ...overview.stageDetails.map((stage) => [
      "stage",
      stage.stageId,
      stage.stagiaire,
      stage.encadrant,
      stage.departement,
      stage.sujet,
      stage.stageStatusLabel,
      stage.latestProgressLabel,
      stage.latestReportAtLabel,
      stage.pendingReportsCount,
      stage.pendingEvaluationsCount,
      stage.documentAttentionCount,
      stage.daysUntilEndLabel,
      stage.attentionLabel,
      analyticsPeriodDefinitions[overview.period].label,
      overview.range.label,
      overview.scopeLabel,
    ]),
  ];

  return `\uFEFF${lines
    .map((line) => line.map((value) => escapeCsvValue(value)).join(";"))
    .join("\n")}`;
}

export function buildDepartmentAnalyticsCsv(overview: AnalyticsOverview) {
  const lines = [
    [
      "section",
      "departement",
      "stages",
      "stagesActifs",
      "completion",
      "progressionMoyenne",
      "rapportsExploites",
      "periode",
      "fenetre",
      "scope",
    ],
    ...overview.departments.map((department) => [
      "departement",
      department.departement,
      department.stageCount,
      department.activeStageCount,
      department.completionRateLabel,
      department.averageProgressLabel,
      department.trackedReportsCount,
      analyticsPeriodDefinitions[overview.period].label,
      overview.range.label,
      overview.scopeLabel,
    ]),
  ];

  return `\uFEFF${lines
    .map((line) => line.map((value) => escapeCsvValue(value)).join(";"))
    .join("\n")}`;
}
