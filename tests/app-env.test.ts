import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppEnv } from "@/lib/env";

describe("app env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("provides sane defaults for local and test environments", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DEFAULT_USER_PASSWORD", "Password123!");

    const env = getAppEnv();

    expect(env.REDIS_ENABLED).toBe(false);
    expect(env.REDIS_CHANNEL_PREFIX).toBe("gestion-stagiaires");
    expect(env.DOCUMENT_STORAGE_DRIVER).toBe("local");
    expect(env.NEXTAUTH_URL).toBe("http://localhost:3000");
  });

  it("rejects partially configured OAuth providers", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DEFAULT_USER_PASSWORD", "Password123!");
    vi.stubEnv("AUTH_GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("AUTH_GOOGLE_CLIENT_SECRET", "");

    expect(() => getAppEnv()).toThrowError(
      /Google OAuth doit definir AUTH_GOOGLE_CLIENT_ID et AUTH_GOOGLE_CLIENT_SECRET ensemble\./,
    );
  });
});
