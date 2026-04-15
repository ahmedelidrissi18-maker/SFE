import { describe, expect, it, vi } from "vitest";
import {
  buildGithubOAuthAuthorizeUrl,
  buildGithubOAuthRedirectUri,
  decodeGithubOAuthCookie,
  encodeGithubOAuthCookie,
} from "@/lib/github/oauth";

describe("github oauth helpers", () => {
  it("encode puis decode le payload OAuth", () => {
    const payload = {
      state: "state-123",
      stagiaireId: "stagiaire-1",
      actorUserId: "user-rh-1",
      returnTo: "/stagiaires/stagiaire-1",
    };

    expect(decodeGithubOAuthCookie(encodeGithubOAuthCookie(payload))).toEqual(payload);
  });

  it("retourne null pour un cookie invalide", () => {
    expect(decodeGithubOAuthCookie("not-valid")).toBeNull();
  });

  it("construit l url d autorisation GitHub", () => {
    vi.stubEnv("GITHUB_CLIENT_ID", "github-client-id");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "github-client-secret");

    const authorizeUrl = new URL(
      buildGithubOAuthAuthorizeUrl({
        origin: "http://localhost:3000",
        state: "state-123",
      }),
    );

    expect(authorizeUrl.origin).toBe("https://github.com");
    expect(authorizeUrl.pathname).toBe("/login/oauth/authorize");
    expect(authorizeUrl.searchParams.get("client_id")).toBe("github-client-id");
    expect(authorizeUrl.searchParams.get("state")).toBe("state-123");
    expect(authorizeUrl.searchParams.get("redirect_uri")).toBe(
      buildGithubOAuthRedirectUri("http://localhost:3000"),
    );

    vi.unstubAllEnvs();
  });
});
