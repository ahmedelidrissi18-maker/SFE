import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  analyticsExportModeDefinitions,
  analyticsPeriodDefinitions,
  buildAnalyticsCsv,
  buildDepartmentAnalyticsCsv,
  buildDetailedAnalyticsCsv,
  canAccessAnalytics,
  filterDepartmentAnalytics,
  filterStageAnalyticsDetails,
  getAnalyticsOverviewWithMeta,
  resolveAnalyticsAttentionFilter,
  resolveAnalyticsDepartmentFilter,
  resolveAnalyticsExportMode,
  resolveAnalyticsPeriod,
  resolveAnalyticsStageDetailLimit,
} from "@/lib/analytics";
import { recordPerformanceSample } from "@/lib/observability";
import { buildActorRateLimitKey, buildRateLimitHeaders, buildRateLimitedResponse, extractRequestIp } from "@/lib/security/request";
import { consumeRateLimit, securityRateLimits } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!canAccessAnalytics(session.user.role)) {
    return NextResponse.redirect(new URL("/acces-refuse", request.url));
  }

  const rateLimitResult = consumeRateLimit({
    ...securityRateLimits.analyticsExport,
    key: buildActorRateLimitKey(session.user.id, extractRequestIp(request) ?? "unknown"),
  });

  if (!rateLimitResult.allowed) {
    return buildRateLimitedResponse(rateLimitResult, {
      body: "Trop d exports analytics ont ete demandes. Merci de patienter avant de relancer.",
    });
  }

  const url = new URL(request.url);
  const period = resolveAnalyticsPeriod(url.searchParams.get("period"));
  const mode = resolveAnalyticsExportMode(url.searchParams.get("mode"));
  const attentionFilter = resolveAnalyticsAttentionFilter(url.searchParams.get("attention"));
  const detailLimit = resolveAnalyticsStageDetailLimit(url.searchParams.get("limit"));
  const startedAt = Date.now();

  try {
    const { overview, meta } = await getAnalyticsOverviewWithMeta({
      role: session.user.role,
      userId: session.user.id,
      period,
    });
    const departmentFilter = resolveAnalyticsDepartmentFilter(
      url.searchParams.get("department"),
      overview.departments,
    );
    const exportOverview = {
      ...overview,
      departments: filterDepartmentAnalytics(overview.departments, departmentFilter),
      stageDetails: filterStageAnalyticsDetails(overview.stageDetails, {
        attention: attentionFilter,
        department: departmentFilter,
        limit: detailLimit,
      }),
    };
    const body =
      mode === "detailed"
        ? buildDetailedAnalyticsCsv(exportOverview)
        : mode === "departments"
          ? buildDepartmentAnalyticsCsv(exportOverview)
          : buildAnalyticsCsv(exportOverview);

    recordPerformanceSample({
      scope: "analytics-export",
      durationMs: Date.now() - startedAt,
      cached: meta.cached,
      detail: `role=${session.user.role};period=${period};mode=${mode};attention=${attentionFilter};department=${departmentFilter ?? "all"};limit=${detailLimit}`,
    });

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-${mode}-${period}.csv"`,
        "Cache-Control": "no-store",
        "X-Analytics-Period": analyticsPeriodDefinitions[period].label,
        "X-Analytics-Export-Mode": analyticsExportModeDefinitions[mode].label,
        "X-Analytics-Cache": meta.cached ? "HIT" : "MISS",
        "X-Analytics-Attention-Filter": attentionFilter,
        "X-Analytics-Department-Filter": departmentFilter ?? "ALL",
        ...Object.fromEntries(buildRateLimitHeaders(rateLimitResult)),
      },
    });
  } catch (error) {
    recordPerformanceSample({
      scope: "analytics-export",
      durationMs: Date.now() - startedAt,
      ok: false,
      detail: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
