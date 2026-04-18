import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  buildGithubOAuthAuthorizeUrl,
  createGithubOAuthState,
  encodeGithubOAuthCookie,
  getGithubOAuthCookieName,
  getGithubOAuthCookieTtlSeconds,
} from "@/lib/github/oauth";
import { logAuditEvent } from "@/lib/audit";
import { hasRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { buildActorRateLimitKey, buildRateLimitedResponse, extractRequestIp } from "@/lib/security/request";
import { consumeRateLimit, securityRateLimits } from "@/lib/security/rate-limit";

function buildRedirectUrl(origin: string, returnTo: string, params: Record<string, string>) {
  const url = new URL(returnTo, origin);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const stagiaireId = request.nextUrl.searchParams.get("stagiaireId")?.trim() ?? "";
  const returnTo =
    request.nextUrl.searchParams.get("returnTo")?.trim() || `/stagiaires/${stagiaireId}`;

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (!hasRole(session.user.role, ["ADMIN", "RH"])) {
    return NextResponse.redirect(new URL("/acces-refuse", request.nextUrl));
  }

  const rateLimitResult = consumeRateLimit({
    ...securityRateLimits.githubConnect,
    key: buildActorRateLimitKey(session.user.id, extractRequestIp(request) ?? "unknown"),
  });

  if (!rateLimitResult.allowed) {
    return buildRateLimitedResponse(rateLimitResult, {
      body: "Trop de demandes GitHub. Merci de patienter avant de relancer une connexion OAuth.",
    });
  }

  if (!stagiaireId) {
    return NextResponse.redirect(
      buildRedirectUrl(request.nextUrl.origin, "/stagiaires", {
        githubError: "missing_stagiaire",
      }),
    );
  }

  const stagiaire = await prisma.stagiaire.findUnique({
    where: { id: stagiaireId },
    select: {
      id: true,
    },
  });

  if (!stagiaire) {
    return NextResponse.redirect(
      buildRedirectUrl(request.nextUrl.origin, "/stagiaires", {
        githubError: "unknown_stagiaire",
      }),
    );
  }

  try {
    const state = createGithubOAuthState();
    const response = NextResponse.redirect(
      buildGithubOAuthAuthorizeUrl({
        origin: request.nextUrl.origin,
        state,
      }),
    );

    response.cookies.set({
      name: getGithubOAuthCookieName(),
      value: encodeGithubOAuthCookie({
        state,
        stagiaireId,
        actorUserId: session.user.id,
        returnTo,
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: getGithubOAuthCookieTtlSeconds(),
    });

    await logAuditEvent({
      userId: session.user.id,
      action: "GITHUB_OAUTH_STARTED",
      entite: "GithubConnection",
      entiteId: stagiaireId,
      nouvelleValeur: {
        stagiaireId,
      },
    });

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.redirect(
      buildRedirectUrl(request.nextUrl.origin, returnTo, {
        githubError: "oauth_not_configured",
      }),
    );
  }
}
