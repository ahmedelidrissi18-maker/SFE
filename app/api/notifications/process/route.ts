import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { processPendingNotificationDispatchJobs } from "@/lib/notifications";
import { hasRole } from "@/lib/rbac";
import { buildActorRateLimitKey, buildRateLimitedResponse, extractRequestIp } from "@/lib/security/request";
import { consumeRateLimit, securityRateLimits } from "@/lib/security/rate-limit";

function hasInternalProcessorAccess(request: Request) {
  const configuredSecret = process.env.NOTIFICATIONS_PROCESSOR_SECRET?.trim();

  if (!configuredSecret) {
    return false;
  }

  return request.headers.get("x-notifications-secret") === configuredSecret;
}

export async function POST(request: Request) {
  const session = await auth();
  const hasSessionAccess = Boolean(
    session?.user && hasRole(session.user.role, ["ADMIN", "RH"]),
  );

  if (!hasSessionAccess && !hasInternalProcessorAccess(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResult = consumeRateLimit({
    ...securityRateLimits.notificationsProcess,
    key: buildActorRateLimitKey(
      session?.user?.id ?? "internal-processor",
      extractRequestIp(request) ?? "unknown",
    ),
  });

  if (!rateLimitResult.allowed) {
    return buildRateLimitedResponse(rateLimitResult, {
      json: {
        error: "Too many requests",
      },
    });
  }

  const result = await processPendingNotificationDispatchJobs(20);

  return NextResponse.json({
    status: "ok",
    ...result,
  });
}
