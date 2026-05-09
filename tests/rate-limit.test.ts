import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAllRateLimits,
  consumeRateLimit,
  resetRateLimit,
} from "@/lib/security/rate-limit";

describe("rate limit helpers", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  it("allows requests until the configured limit is reached", async () => {
    const first = await consumeRateLimit({
      namespace: "test",
      key: "user-1",
      limit: 2,
      windowMs: 60_000,
    });
    const second = await consumeRateLimit({
      namespace: "test",
      key: "user-1",
      limit: 2,
      windowMs: 60_000,
    });
    const third = await consumeRateLimit({
      namespace: "test",
      key: "user-1",
      limit: 2,
      windowMs: 60_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets an actor bucket after a successful flow", async () => {
    await consumeRateLimit({
      namespace: "test",
      key: "user-2",
      limit: 1,
      windowMs: 60_000,
    });

    await resetRateLimit({
      namespace: "test",
      key: "user-2",
    });

    const next = await consumeRateLimit({
      namespace: "test",
      key: "user-2",
      limit: 1,
      windowMs: 60_000,
    });

    expect(next.allowed).toBe(true);
  });
});
