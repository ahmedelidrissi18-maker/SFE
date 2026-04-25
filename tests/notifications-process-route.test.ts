import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllRateLimits } from "@/lib/security/rate-limit";

const authMock = vi.fn();
const processPendingJobsMock = vi.fn();
const ensureEndingSoonNotificationsMock = vi.fn();
const afterMock = vi.fn(async (callback: () => Promise<unknown> | unknown) => {
  await callback();
});

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/notifications", () => ({
  ensureEndingSoonNotifications: ensureEndingSoonNotificationsMock,
  processPendingNotificationDispatchJobs: processPendingJobsMock,
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");

  return {
    ...actual,
    after: afterMock,
  };
});

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
    expect(afterMock).not.toHaveBeenCalled();
  });

  it("accepte un admin et planifie le traitement hors du temps de reponse", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-admin-1",
        role: "ADMIN",
      },
    });
    ensureEndingSoonNotificationsMock.mockResolvedValue({
      scannedStages: 3,
      created: 1,
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

    expect(response.status).toBe(202);
    expect(payload).toEqual({
      status: "accepted",
    });
    expect(afterMock).toHaveBeenCalledTimes(1);
    expect(ensureEndingSoonNotificationsMock).toHaveBeenCalledTimes(1);
    expect(processPendingJobsMock).toHaveBeenCalledWith(20);
  });

  it("retourne 429 quand la route est appelee trop souvent", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-admin-1",
        role: "ADMIN",
      },
    });
    ensureEndingSoonNotificationsMock.mockResolvedValue({
      scannedStages: 0,
      created: 0,
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

      expect(response.status).toBe(202);
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
