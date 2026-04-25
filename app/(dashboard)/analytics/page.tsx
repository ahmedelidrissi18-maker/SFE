import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTimeFr } from "@/lib/date";
import {
  analyticsPeriodDefinitions,
  buildStageAttentionSummary,
  canAccessAnalytics,
  filterDepartmentAnalytics,
  filterStageAnalyticsDetails,
  getAnalyticsAttentionFilterOptions,
  getAnalyticsDepartmentOptions,
  getAnalyticsOverviewWithMeta,
  getAnalyticsPeriodOptions,
  getAnalyticsStageDetailLimitOptions,
  resolveAnalyticsAttentionFilter,
  resolveAnalyticsDepartmentFilter,
  resolveAnalyticsPeriod,
  resolveAnalyticsStageDetailLimit,
} from "@/lib/analytics";
import {
  getObservabilitySnapshot,
  type MonitoringStatus,
} from "@/lib/observability";

type AnalyticsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getMonitoringTone(status: MonitoringStatus) {
  if (status === "critical") {
    return "bg-error-container text-on-error-container";
  }

  if (status === "warning") {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  return "bg-secondary-fixed text-on-secondary-fixed";
}

function getAlertTone(severity: "critical" | "warning" | "info") {
  if (severity === "critical") {
    return "bg-error-container text-on-error-container";
  }

  if (severity === "warning") {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  return "bg-primary-fixed text-on-primary-fixed-variant";
}

function getAttentionTone(key: "critical" | "warning" | "stable") {
  if (key === "critical") {
    return "bg-error-container text-on-error-container";
  }

  if (key === "warning") {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  return "bg-secondary-fixed text-on-secondary-fixed";
}

const metricIcons = ["schedule", "assignment", "pending_actions", "work_history"];
const focusIcons = ["assignment", "schedule", "analytics", "description"];
const analyticsFilterLabels = {
  period: "Période",
  department: "Département",
  attention: "Vigilance",
  limit: "Détail",
} as const;
const defaultAnalyticsDetailLimit = 8;

function getAnalyticsMetricValueClassName(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  const isEmptyLikeValue =
    normalizedValue.startsWith("aucun") ||
    normalizedValue.startsWith("aucune") ||
    /^0([.,]0+)?\s*(%|h|j)?$/.test(normalizedValue);

  return isEmptyLikeValue
    ? "inline-flex w-fit items-center rounded-full bg-surface-container-high px-3 py-1 text-xl sm:text-2xl"
    : undefined;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccessAnalytics(session.user.role)) {
    redirect("/acces-refuse");
  }

  const params = (await searchParams) ?? {};
  const period = resolveAnalyticsPeriod(getStringParam(params.period)?.trim());
  const attentionFilter = resolveAnalyticsAttentionFilter(getStringParam(params.attention)?.trim());
  const detailLimit = resolveAnalyticsStageDetailLimit(getStringParam(params.limit)?.trim());
  const requestedDepartment = getStringParam(params.department)?.trim();
  const overviewResult = await getAnalyticsOverviewWithMeta({
    role: session.user.role,
    userId: session.user.id,
    period,
    trackPerformance: true,
  });

  const { overview, meta } = overviewResult;
  const departmentFilter = resolveAnalyticsDepartmentFilter(requestedDepartment, overview.departments);
  const filteredDepartments = filterDepartmentAnalytics(overview.departments, departmentFilter);
  const attentionOptions = getAnalyticsAttentionFilterOptions();
  const departmentOptions = getAnalyticsDepartmentOptions(overview.departments);
  const attentionFilterLabel =
    attentionOptions.find((option) => option.value === attentionFilter)?.label ?? "Toutes";
  const activeFilterChips = [
    period !== "monthly"
      ? `${analyticsFilterLabels.period} : ${analyticsPeriodDefinitions[period].shortLabel}`
      : null,
    departmentFilter ? `${analyticsFilterLabels.department} : ${departmentFilter}` : null,
    attentionFilter !== "all" ? `${analyticsFilterLabels.attention} : ${attentionFilterLabel}` : null,
    detailLimit !== defaultAnalyticsDetailLimit ? `${analyticsFilterLabels.limit} : ${detailLimit} lignes` : null,
  ].filter((chip): chip is string => Boolean(chip));
  const scopedStageDetails = filterStageAnalyticsDetails(overview.stageDetails, {
    department: departmentFilter,
  });
  const filteredStageDetails = filterStageAnalyticsDetails(overview.stageDetails, {
    attention: attentionFilter,
    department: departmentFilter,
    limit: detailLimit,
  });
  const attentionSummary = buildStageAttentionSummary(scopedStageDetails);
  const overviewExportParams = new URLSearchParams({
    period,
    mode: "overview",
  });
  const detailedExportParams = new URLSearchParams({
    period,
    mode: "detailed",
    attention: attentionFilter,
    limit: String(detailLimit),
  });
  const departmentExportParams = new URLSearchParams({
    period,
    mode: "departments",
  });

  if (departmentFilter) {
    detailedExportParams.set("department", departmentFilter);
    departmentExportParams.set("department", departmentFilter);
  }

  const monitoring = getObservabilitySnapshot();
  const overviewHealth = monitoring.scopes.find((scope) => scope.scope === "analytics-overview");
  const exportHealth = monitoring.scopes.find((scope) => scope.scope === "analytics-export");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pilotage"
        title="Tableau de bord analytique"
        description="Suivez les KPIs, les points de charge et la progression par département sur les 30 derniers jours."
        actions={
          <>
            <Link
              href={`/api/analytics/export?${overviewExportParams.toString()}`}
              className="action-button action-button-primary px-5 py-3 text-sm"
            >
              <MaterialSymbol icon="download" className="text-[18px]" />
              Export KPI
            </Link>
            <Link
              href={`/api/analytics/export?${detailedExportParams.toString()}`}
              className="action-button action-button-secondary px-5 py-3 text-sm"
            >
              <MaterialSymbol icon="radar" className="text-[18px]" />
              Export détail
            </Link>
            <Link
              href={`/api/analytics/export?${departmentExportParams.toString()}`}
              className="action-button action-button-secondary px-5 py-3 text-sm"
            >
              <MaterialSymbol icon="bar_chart" className="text-[18px]" />
              Export départements
            </Link>
            <Link
              href="/dashboard"
              className="action-button action-button-secondary px-5 py-3 text-sm"
            >
              Retour au dashboard
            </Link>
          </>
        }
      />

      <Card className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Pilotage</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Fenêtre d&apos;analyse</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Les calculs sont centrés sur la période sélectionnée et sur votre périmètre d’accès.
              Fenêtre actuelle : {overview.range.label}.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 text-sm text-muted lg:items-end">
            <p>
              Généré le <span className="font-medium text-foreground">{formatDateTimeFr(meta.generatedAt)}</span>
            </p>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.cached ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container-high text-on-surface-variant"}`}
            >
              {meta.cached ? "Cache analytics actif" : "Calcul direct"}
            </span>
          </div>
        </div>

        <form className="flex flex-wrap items-end gap-3">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Période</span>
            <select
              name="period"
              defaultValue={period}
              className="field-shell min-w-[220px] rounded-2xl px-4 py-3 outline-none transition"
            >
              {getAnalyticsPeriodOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.helper}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Département</span>
            <select
              name="department"
              defaultValue={departmentFilter ?? ""}
              className="field-shell min-w-[220px] rounded-2xl px-4 py-3 outline-none transition"
            >
              <option value="">Tous les départements</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Vigilance</span>
            <select
              name="attention"
              defaultValue={attentionFilter}
              className="field-shell min-w-[220px] rounded-2xl px-4 py-3 outline-none transition"
            >
              {attentionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.helper}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Volume détaillé</span>
            <select
              name="limit"
              defaultValue={detailLimit}
              className="field-shell min-w-[180px] rounded-2xl px-4 py-3 outline-none transition"
            >
              {getAnalyticsStageDetailLimitOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="action-button action-button-secondary px-5 py-3 text-sm"
          >
            Appliquer les filtres
          </button>
        </form>

        {activeFilterChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              Filtres actifs
            </span>
            {activeFilterChips.map((chip) => (
              <span key={chip} className="rounded-full bg-surface-container-high px-3 py-1">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.metrics.map((metric, index) => {
          const icon = metricIcons[index] ?? "bar_chart";

          return (
            <MetricCard
              key={metric.key}
              label={metric.label}
              value={metric.value}
              helper={metric.helper}
              valueClassName={getAnalyticsMetricValueClassName(metric.value)}
              accent={<MaterialSymbol icon={icon} className="text-[20px]" />}
            />
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.focusItems.map((item, index) => {
          const icon = focusIcons[index] ?? "insights";

          return (
            <MetricCard
              key={item.key}
              label={item.label}
              value={item.value}
              helper={item.helper}
              valueClassName={getAnalyticsMetricValueClassName(item.value)}
              accent={<MaterialSymbol icon={icon} className="text-[20px]" />}
            />
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Départements</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Progression moyenne</h2>
            </div>
            <p className="text-sm text-muted">
              {filteredDepartments.length} département
              {filteredDepartments.length > 1 ? "s" : ""} visible
              {filteredDepartments.length > 1 ? "s" : ""}
            </p>
          </div>

          {filteredDepartments.length > 0 ? (
            <div className="space-y-3">
              {filteredDepartments.map((department) => (
                <div
                  key={department.departement}
                  className="tonal-card rounded-[24px] p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{department.departement}</h3>
                      <p className="text-sm leading-6 text-muted">
                        {department.stageCount} stage{department.stageCount > 1 ? "s" : ""} sur la
                        période, {department.activeStageCount} actif
                        {department.activeStageCount > 1 ? "s" : ""},{" "}
                        {department.trackedReportsCount} rapport
                        {department.trackedReportsCount > 1 ? "s" : ""} exploitable
                        {department.trackedReportsCount > 1 ? "s" : ""}.
                      </p>
                    </div>

                    <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                      <div className="rounded-[20px] bg-surface-container-lowest p-3 shadow-[var(--shadow-soft)]">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">Progression</p>
                        <p className="mt-2 text-lg font-semibold">{department.averageProgressLabel}</p>
                      </div>
                      <div className="rounded-[20px] bg-surface-container-lowest p-3 shadow-[var(--shadow-soft)]">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">Completion</p>
                        <p className="mt-2 text-lg font-semibold">{department.completionRateLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow="Analytique"
              title="Aucun département exploitable"
              description={
                departmentFilter
                  ? `Le département ${departmentFilter} ne remonte aucune activité exploitable sur la période choisie.`
                  : "Aucune activité visible ne permet encore de calculer une progression moyenne sur la période choisie."
              }
              actionHref="/analytics"
              actionLabel="Revenir à la vue complète"
            />
          )}
        </Card>

        <Card className="space-y-5">
          <div>
            <p className="text-sm font-medium text-primary">Couverture</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Volume exploité</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Cette vue centralise les lots réels pris en compte dans les calculs de la période.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="tonal-card rounded-[22px] p-4">
              <p className="text-sm text-muted">Stages inclus</p>
              <p className="mt-2 text-2xl font-semibold">{overview.totals.stageCount}</p>
            </div>
            <div className="tonal-card rounded-[22px] p-4">
              <p className="text-sm text-muted">Rapports traités</p>
              <p className="mt-2 text-2xl font-semibold">{overview.totals.reportCount}</p>
            </div>
            <div className="tonal-card rounded-[22px] p-4">
              <p className="text-sm text-muted">Évaluations suivies</p>
              <p className="mt-2 text-2xl font-semibold">{overview.totals.evaluationCount}</p>
            </div>
            <div className="tonal-card rounded-[22px] p-4">
              <p className="text-sm text-muted">Documents validés</p>
              <p className="mt-2 text-2xl font-semibold">{overview.totals.documentCount}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Surveillance métier</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Alertes actives</h2>
            </div>
            <MaterialSymbol icon="warning" className="text-[20px] text-primary" />
          </div>

          {overview.alerts.length > 0 ? (
            <div className="space-y-3">
              {overview.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-[24px] p-4 ${getAlertTone(alert.severity)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <p className="mt-2 text-sm leading-6">{alert.description}</p>
                    </div>
                    <span className="rounded-full bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune alerte métier"
              description="Les KPI critiques sont dans la cible sur la fenêtre et le backlog reste contenu."
            />
          )}
        </Card>

        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Santé technique</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Observabilité analytics</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Fenêtre glissante de {monitoring.windowMinutes} minutes sur les chargements et exports.
              </p>
            </div>
            <StatusBadge
              status={
                monitoring.status === "ok"
                  ? "Stable"
                  : monitoring.status === "warning"
                    ? "A surveiller"
                    : "Critique"
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[overviewHealth, exportHealth].map((scope) =>
              scope ? (
                <div key={scope.scope} className="tonal-card rounded-[22px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{scope.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
                        Cible {scope.targetMs} ms
                      </p>
                    </div>
                    <MaterialSymbol icon="monitoring" className="text-[18px] text-primary" />
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <p>
                      p95 <span className="font-semibold text-foreground">{scope.p95Ms ?? "-"} ms</span>
                    </p>
                    <p>
                      moyenne{" "}
                      <span className="font-semibold text-foreground">{scope.averageMs ?? "-"} ms</span>
                    </p>
                    <p>
                      requêtes{" "}
                      <span className="font-semibold text-foreground">{scope.requestCount}</span>
                    </p>
                    <p>
                      cache{" "}
                      <span className="font-semibold text-foreground">
                        {scope.cacheHitRate ?? 0} %
                      </span>
                    </p>
                  </div>
                </div>
              ) : null,
            )}
          </div>

          {monitoring.alerts.length > 0 ? (
            <div className="space-y-3">
              {monitoring.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-[20px] p-4 ${getMonitoringTone(alert.status)}`}
                >
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="mt-2 text-sm leading-6">{alert.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] bg-secondary-fixed p-4 text-sm text-on-secondary-fixed">
              Aucun dépassement technique détecté sur la fenêtre récente.
            </div>
          )}
        </Card>
      </section>

      <Card className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Vues détaillées</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Stages à surveiller</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Priorisation des dossiers les plus sensibles sur la fenêtre sélectionnée, avec filtres
              par département et niveau de vigilance.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <MaterialSymbol icon="speed" className="text-[18px]" />
            {filteredStageDetails.length} stage
            {filteredStageDetails.length > 1 ? "s" : ""} affiché
            {filteredStageDetails.length > 1 ? "s" : ""} sur {scopedStageDetails.length}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {attentionSummary.map((summary) => (
            <div
              key={summary.key}
              className={`rounded-[22px] p-4 ${getAttentionTone(summary.key)}`}
            >
              <p className="text-xs uppercase tracking-[0.16em]">Vigilance</p>
              <p className="mt-2 text-lg font-semibold">{summary.label}</p>
              <p className="mt-1 text-sm">{summary.count} stage(s) sur le périmètre filtré</p>
            </div>
          ))}
        </div>

        {filteredStageDetails.length > 0 ? (
          <div className="grid gap-3">
            {filteredStageDetails.map((stage) => (
              <div key={stage.stageId} className="tonal-card rounded-[24px] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={stage.stageStatusLabel} />
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${stage.attentionLabel === "Critique" ? "bg-error-container text-on-error-container" : stage.attentionLabel === "Attention" ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-secondary-fixed text-on-secondary-fixed"}`}
                      >
                        {stage.attentionLabel}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold">{stage.stagiaire}</h3>
                      <p className="text-sm text-muted">
                        {stage.departement} · {stage.sujet}
                      </p>
                      <p className="text-sm text-muted">Encadrant : {stage.encadrant}</p>
                    </div>
                  </div>

                  <div className="grid min-w-[260px] gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-[18px] bg-surface-container-lowest p-3 shadow-[var(--shadow-soft)]">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Progression</p>
                      <p className="mt-2 text-sm font-semibold">{stage.latestProgressLabel}</p>
                    </div>
                    <div className="rounded-[18px] bg-surface-container-lowest p-3 shadow-[var(--shadow-soft)]">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Dernier rapport</p>
                      <p className="mt-2 text-sm font-semibold">{stage.latestReportAtLabel}</p>
                    </div>
                    <div className="rounded-[18px] bg-surface-container-lowest p-3 shadow-[var(--shadow-soft)]">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Échéance</p>
                      <p className="mt-2 text-sm font-semibold">{stage.daysUntilEndLabel}</p>
                    </div>
                    <div className="rounded-[18px] bg-surface-container-lowest p-3 shadow-[var(--shadow-soft)]">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Rapports</p>
                      <p className="mt-2 text-sm font-semibold">{stage.pendingReportsCount} en attente</p>
                    </div>
                    <div className="rounded-[18px] bg-surface-container-lowest p-3 shadow-[var(--shadow-soft)]">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Évaluations</p>
                      <p className="mt-2 text-sm font-semibold">
                        {stage.pendingEvaluationsCount} à valider
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-surface-container-lowest p-3 shadow-[var(--shadow-soft)]">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Documents</p>
                      <p className="mt-2 text-sm font-semibold">
                        {stage.documentAttentionCount} a revoir
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="Analytique"
            title="Aucun stage détaillé"
            description="Aucun stage ne correspond aux filtres actifs sur la fenêtre courante."
            actionHref="/analytics"
            actionLabel="Revenir à la vue complète"
          />
        )}
      </Card>
    </div>
  );
}
