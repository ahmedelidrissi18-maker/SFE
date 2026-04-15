import { randomBytes } from "node:crypto";

const GITHUB_OAUTH_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_OAUTH_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_OAUTH_COOKIE_NAME = "github_oauth_state";
const GITHUB_OAUTH_COOKIE_TTL_SECONDS = 10 * 60;
const GITHUB_OAUTH_SCOPES = ["read:user", "repo"];

type GithubOAuthCookiePayload = {
  state: string;
  stagiaireId: string;
  actorUserId: string;
  returnTo: string;
};

type GithubOAuthTokenResponse = {
  access_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GithubAuthenticatedUser = {
  id: number;
  login: string;
  html_url: string;
  avatar_url: string | null;
};

function getGithubOAuthConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth n est pas configure. Ajoutez GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET.");
  }

  return { clientId, clientSecret };
}

export function getGithubOAuthCookieName() {
  return GITHUB_OAUTH_COOKIE_NAME;
}

export function createGithubOAuthState() {
  return randomBytes(24).toString("hex");
}

export function encodeGithubOAuthCookie(payload: GithubOAuthCookiePayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeGithubOAuthCookie(value?: string | null): GithubOAuthCookiePayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

    if (
      typeof parsedValue?.state === "string" &&
      typeof parsedValue?.stagiaireId === "string" &&
      typeof parsedValue?.actorUserId === "string" &&
      typeof parsedValue?.returnTo === "string"
    ) {
      return parsedValue as GithubOAuthCookiePayload;
    }

    return null;
  } catch {
    return null;
  }
}

export function getGithubOAuthCookieTtlSeconds() {
  return GITHUB_OAUTH_COOKIE_TTL_SECONDS;
}

export function buildGithubOAuthRedirectUri(origin: string) {
  return `${origin}/api/github/callback`;
}

export function buildGithubOAuthAuthorizeUrl(input: {
  origin: string;
  state: string;
}) {
  const { clientId } = getGithubOAuthConfig();
  const url = new URL(GITHUB_OAUTH_AUTHORIZE_URL);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", buildGithubOAuthRedirectUri(input.origin));
  url.searchParams.set("scope", GITHUB_OAUTH_SCOPES.join(" "));
  url.searchParams.set("state", input.state);
  url.searchParams.set("allow_signup", "false");

  return url.toString();
}

export async function exchangeGithubOAuthCode(input: {
  code: string;
  origin: string;
}) {
  const { clientId, clientSecret } = getGithubOAuthConfig();

  const response = await fetch(GITHUB_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: input.code,
      redirect_uri: buildGithubOAuthRedirectUri(input.origin),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Echange OAuth GitHub impossible pour le moment.");
  }

  const tokenPayload = (await response.json()) as GithubOAuthTokenResponse;

  if (!tokenPayload.access_token) {
    throw new Error(tokenPayload.error_description || "Token GitHub non recu apres l autorisation.");
  }

  return tokenPayload.access_token;
}

export async function fetchGithubAuthenticatedUser(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "gestion-stagiaires-v2",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Lecture du profil GitHub OAuth impossible.");
  }

  return (await response.json()) as GithubAuthenticatedUser;
}
