import { after, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAppEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  ensureAutomatedBusinessAlerts,
  ensureEndingSoonNotifications,
  processPendingNotificationDispatchJobs,
} from "@/lib/notifications";
import { hasRole } from "@/lib/rbac";
import { buildActorRateLimitKey, buildRateLimitedResponse, extractRequestIp } from "@/lib/security/request";
import { consumeRateLimit, securityRateLimits } from "@/lib/security/rate-limit";

function hasInternalProcessorAccess(request: Request) {
  const configuredSecret = getAppEnv().NOTIFICATIONS_PROCESSOR_SECRET;

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

  const rateLimitResult = await consumeRateLimit({
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

  after(async () => {
    try {
      await Promise.all([
        ensureEndingSoonNotifications(),
        ensureAutomatedBusinessAlerts(),
        processPendingNotificationDispatchJobs(20),
      ]);
    } catch (error) {
      logger.error("notifications.processor.after_failed", { error });
    }
  });

  return NextResponse.json(
    {
      status: "accepted",
    },
    { status: 202 },
  );
}
