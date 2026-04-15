import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn();
const findUniqueMock = vi.fn();
const buildAuthorizeUrlMock = vi.fn();
const logAuditEventMock = vi.fn();

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stagiaire: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("@/lib/github/oauth", () => ({
  buildGithubOAuthAuthorizeUrl: buildAuthorizeUrlMock,
  createGithubOAuthState: vi.fn(() => "state-123"),
  encodeGithubOAuthCookie: vi.fn(() => "encoded-cookie"),
  getGithubOAuthCookieName: vi.fn(() => "github_oauth_state"),
  getGithubOAuthCookieTtlSeconds: vi.fn(() => 600),
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent: logAuditEventMock,
}));

describe("github connect route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildAuthorizeUrlMock.mockReturnValue("https://github.com/login/oauth/authorize?state=state-123");
  });

  it("redirige vers /login quand la session est absente", async () => {
    authMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/github/connect/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/github/connect?stagiaireId=stagiaire-1"),
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

    const { GET } = await import("@/app/api/github/connect/route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/github/connect?stagiaireId=stagiaire-1"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/acces-refuse");
  });

  it("demarre le flux OAuth pour un role autorise", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-rh-1",
        role: "RH",
      },
    });
    findUniqueMock.mockResolvedValue({ id: "stagiaire-1" });

    const { GET } = await import("@/app/api/github/connect/route");
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/api/github/connect?stagiaireId=stagiaire-1&returnTo=%2Fstagiaires%2Fstagiaire-1",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("https://github.com/login/oauth/authorize");
    expect(response.headers.get("set-cookie")).toContain("github_oauth_state=encoded-cookie");
    expect(logAuditEventMock).toHaveBeenCalled();
  });
});
