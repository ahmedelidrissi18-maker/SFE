import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn();
const decodeCookieMock = vi.fn();
const exchangeCodeMock = vi.fn();
const fetchGithubUserMock = vi.fn();
const connectAccountMock = vi.fn();
const logAuditEventMock = vi.fn();

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/github/oauth", () => ({
  decodeGithubOAuthCookie: decodeCookieMock,
  exchangeGithubOAuthCode: exchangeCodeMock,
  fetchGithubAuthenticatedUser: fetchGithubUserMock,
  getGithubOAuthCookieName: vi.fn(() => "github_oauth_state"),
}));

vi.mock("@/lib/github/service", () => ({
  githubService: {
    connectAccount: connectAccountMock,
  },
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: logAuditEventMock,
}));

describe("github callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirige vers /login quand la session est absente", async () => {
    authMock.mockResolvedValue(null);
    decodeCookieMock.mockReturnValue(null);

    const { GET } = await import("@/app/api/github/callback/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/github/callback?state=state-123"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("redirige vers /acces-refuse pour un role non autorise", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-stg-1",
        role: "STAGIAIRE",
      },
    });
    decodeCookieMock.mockReturnValue({
      state: "state-123",
      stagiaireId: "stagiaire-1",
      actorUserId: "user-stg-1",
      returnTo: "/stagiaires/stagiaire-1",
    });

    const { GET } = await import("@/app/api/github/callback/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/github/callback?state=state-123&code=abc"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/acces-refuse");
  });

  it("refuse un state OAuth invalide", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-rh-1",
        role: "RH",
      },
    });
    decodeCookieMock.mockReturnValue({
      state: "state-expected",
      stagiaireId: "stagiaire-1",
      actorUserId: "user-rh-1",
      returnTo: "/stagiaires/stagiaire-1",
    });

    const { GET } = await import("@/app/api/github/callback/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/github/callback?state=bad-state&code=abc"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("githubError=oauth_state_invalid");
  });

  it("finalise la liaison GitHub apres callback OAuth valide", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-rh-1",
        role: "RH",
      },
    });
    decodeCookieMock.mockReturnValue({
      state: "state-123",
      stagiaireId: "stagiaire-1",
      actorUserId: "user-rh-1",
      returnTo: "/stagiaires/stagiaire-1",
    });
    exchangeCodeMock.mockResolvedValue("access-token");
    fetchGithubUserMock.mockResolvedValue({
      login: "octocat",
    });
    connectAccountMock.mockResolvedValue({
      ok: true,
      connection: {
        id: "connection-1",
      },
    });

    const { GET } = await import("@/app/api/github/callback/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/github/callback?state=state-123&code=abc"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("success=github-linked");
    expect(connectAccountMock).toHaveBeenCalledWith({
      stagiaireId: "stagiaire-1",
      username: "octocat",
      linkedByUserId: "user-rh-1",
    });
    expect(logAuditEventMock).toHaveBeenCalled();
  });
});
