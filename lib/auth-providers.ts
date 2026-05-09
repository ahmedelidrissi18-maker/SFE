import { getAppEnv } from "@/lib/env";

export type OAuthProviderId = "google" | "github";

function hasConfiguredValue(value?: string | null) {
  return Boolean(value?.trim());
}

export function isGoogleLoginConfigured() {
  const env = getAppEnv();

  return (
    hasConfiguredValue(env.AUTH_GOOGLE_CLIENT_ID) &&
    hasConfiguredValue(env.AUTH_GOOGLE_CLIENT_SECRET)
  );
}

export function isGithubLoginConfigured() {
  const env = getAppEnv();

  return (
    hasConfiguredValue(env.AUTH_GITHUB_CLIENT_ID) &&
    hasConfiguredValue(env.AUTH_GITHUB_CLIENT_SECRET)
  );
}

export function getConfiguredLoginProviders() {
  return {
    google: isGoogleLoginConfigured(),
    github: isGithubLoginConfigured(),
  };
}
