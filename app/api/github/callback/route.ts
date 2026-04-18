import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { logAuditEvent } from "@/lib/audit";
import {
  decodeGithubOAuthCookie,
  exchangeGithubOAuthCode,
  fetchGithubAuthenticatedUser,
  getGithubOAuthCookieName,
} from "@/lib/github/oauth";
import { hasRole } from "@/lib/rbac";
import { githubService } from "@/lib/github/service";
import { buildActorRateLimitKey, buildRateLimitedResponse, extractRequestIp } from "@/lib/security/request";
import { consumeRateLimit, securityRateLimits } from "@/lib/security/rate-limit";

function buildRedirectUrl(origin: string, returnTo: string, params: Record<string, string>) {
  const url = new URL(returnTo, origin);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

function redirectWithClearedCookie(
  request: NextRequest,
  returnTo: string,
  params: Record<string, string>,
) {
  const response = NextResponse.redirect(
    buildRedirectUrl(request.nextUrl.origin, returnTo, params),
  );
  response.cookies.delete(getGithubOAuthCookieName());
  return response;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const cookiePayload = decodeGithubOAuthCookie(
    request.cookies.get(getGithubOAuthCookieName())?.value,
  );
  const state = request.nextUrl.searchParams.get("state")?.trim() ?? "";
  const code = request.nextUrl.searchParams.get("code")?.trim() ?? "";
  const oauthError = request.nextUrl.searchParams.get("error")?.trim() ?? "";
  const returnTo = cookiePayload?.returnTo || "/stagiaires";

  if (!session?.user) {
    return redirectWithClearedCookie(request, "/login", {});
  }

  if (!hasRole(session.user.role, ["ADMIN", "RH"])) {
    return redirectWithClearedCookie(request, "/acces-refuse", {});
  }

  const rateLimitResult = consumeRateLimit({
    ...securityRateLimits.githubCallback,
    key: buildActorRateLimitKey(session.user.id, extractRequestIp(request) ?? "unknown"),
  });

  if (!rateLimitResult.allowed) {
    return buildRateLimitedResponse(rateLimitResult, {
      body: "Trop de callbacks GitHub ont ete recus sur une courte periode.",
      headers: {
        "Set-Cookie": `${getGithubOAuthCookieName()}=; Max-Age=0; Path=/`,
      },
    });
  }

  if (!cookiePayload || cookiePayload.actorUserId !== session.user.id || cookiePayload.state !== state) {
    return redirectWithClearedCookie(request, returnTo, {
      githubError: "oauth_state_invalid",
    });
  }

  if (oauthError) {
    await logAuditEvent({
      userId: session.user.id,
      action: "GITHUB_OAUTH_FAILED",
      entite: "GithubConnection",
      entiteId: cookiePayload.stagiaireId,
      nouvelleValeur: {
        stagiaireId: cookiePayload.stagiaireId,
        error: oauthError,
      },
    });

    return redirectWithClearedCookie(request, returnTo, {
      githubError: "oauth_denied",
    });
  }

  if (!code) {
    return redirectWithClearedCookie(request, returnTo, {
      githubError: "oauth_code_missing",
    });
  }

  try {
    const accessToken = await exchangeGithubOAuthCode({
      code,
      origin: request.nextUrl.origin,
    });
    const githubUser = await fetchGithubAuthenticatedUser(accessToken);
    const result = await githubService.connectAccount({
      stagiaireId: cookiePayload.stagiaireId,
      username: githubUser.login,
      linkedByUserId: session.user.id,
    });

    if (!result.ok) {
      return redirectWithClearedCookie(request, returnTo, {
        githubError: "link_failed",
      });
    }

    await logAuditEvent({
      userId: session.user.id,
      action: "GITHUB_OAUTH_COMPLETED",
      entite: "GithubConnection",
      entiteId: result.connection?.id ?? cookiePayload.stagiaireId,
      nouvelleValeur: {
        stagiaireId: cookiePayload.stagiaireId,
        username: githubUser.login,
      },
    });

    return redirectWithClearedCookie(request, returnTo, {
      success: "github-linked",
    });
  } catch (error) {
    console.error(error);

    await logAuditEvent({
      userId: session.user.id,
      action: "GITHUB_OAUTH_FAILED",
      entite: "GithubConnection",
      entiteId: cookiePayload.stagiaireId,
      nouvelleValeur: {
        stagiaireId: cookiePayload.stagiaireId,
        error: error instanceof Error ? error.message : "oauth_callback_failed",
      },
    });

    return redirectWithClearedCookie(request, returnTo, {
      githubError: "oauth_callback_failed",
    });
  }
}
