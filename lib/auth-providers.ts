export type OAuthProviderId = "google" | "github";

function hasConfiguredValue(value?: string | null) {
  return Boolean(value?.trim());
}

export function isGoogleLoginConfigured() {
  return (
    hasConfiguredValue(process.env.AUTH_GOOGLE_CLIENT_ID) &&
    hasConfiguredValue(process.env.AUTH_GOOGLE_CLIENT_SECRET)
  );
}

export function isGithubLoginConfigured() {
  return (
    hasConfiguredValue(process.env.AUTH_GITHUB_CLIENT_ID) &&
    hasConfiguredValue(process.env.AUTH_GITHUB_CLIENT_SECRET)
  );
}

export function getConfiguredLoginProviders() {
  return {
    google: isGoogleLoginConfigured(),
    github: isGithubLoginConfigured(),
  };
}
