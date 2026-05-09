import { beforeEach, describe, expect, it, vi } from "vitest";

const healthSnapshotMock = vi.fn();

vi.mock("@/lib/health", () => ({
  getHealthSnapshot: healthSnapshotMock,
}));

describe("health route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 when the platform is healthy", async () => {
    healthSnapshotMock.mockResolvedValue({
      status: "ok",
      service: "gestion-stagiaires",
      timestamp: "2026-05-01T10:00:00.000Z",
      dependencies: {},
      observability: {
        status: "ok",
        generatedAt: "2026-05-01T10:00:00.000Z",
        windowMinutes: 30,
        scopes: [],
        alerts: [],
      },
    });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(200);
  });

  it("returns 503 when a critical dependency is degraded", async () => {
    healthSnapshotMock.mockResolvedValue({
      status: "degraded",
      service: "gestion-stagiaires",
      timestamp: "2026-05-01T10:00:00.000Z",
      dependencies: {},
      observability: {
        status: "critical",
        generatedAt: "2026-05-01T10:00:00.000Z",
        windowMinutes: 30,
        scopes: [],
        alerts: [],
      },
    });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(503);
  });
});
