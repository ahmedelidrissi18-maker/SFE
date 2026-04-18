import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllRateLimits } from "@/lib/security/rate-limit";

const authMock = vi.fn();
const processPendingJobsMock = vi.fn();

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/notifications", () => ({
  processPendingNotificationDispatchJobs: processPendingJobsMock,
}));

describe("notifications process route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllRateLimits();
  });

  it("refuse un utilisateur non autorise", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-stg-1",
        role: "STAGIAIRE",
      },
    });

    const { POST } = await import("@/app/api/notifications/process/route");
    const response = await POST(new Request("http://localhost:3000/api/notifications/process", {
      method: "POST",
    }));

    expect(response.status).toBe(401);
  });

  it("autorise un admin a traiter la file", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-admin-1",
        role: "ADMIN",
      },
    });
    processPendingJobsMock.mockResolvedValue({
      processed: 2,
      pending: 1,
    });

    const { POST } = await import("@/app/api/notifications/process/route");
    const response = await POST(new Request("http://localhost:3000/api/notifications/process", {
      method: "POST",
    }));

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      status: "ok",
      processed: 2,
      pending: 1,
    });
  });

  it("retourne 429 quand la route est appelee trop souvent", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-admin-1",
        role: "ADMIN",
      },
    });
    processPendingJobsMock.mockResolvedValue({
      processed: 1,
      pending: 0,
    });

    const { POST } = await import("@/app/api/notifications/process/route");

    for (let index = 0; index < 20; index += 1) {
      const response = await POST(
        new Request("http://localhost:3000/api/notifications/process", {
          method: "POST",
        }),
      );

      expect(response.status).toBe(200);
    }

    const blockedResponse = await POST(
      new Request("http://localhost:3000/api/notifications/process", {
        method: "POST",
      }),
    );
    const payload = await blockedResponse.json();

    expect(blockedResponse.status).toBe(429);
    expect(payload).toEqual({
      error: "Too many requests",
    });
  });
});
