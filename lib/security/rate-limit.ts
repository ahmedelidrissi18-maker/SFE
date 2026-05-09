import Redis from "ioredis";
import { getAppEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  namespace: string;
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
};

const buckets = new Map<string, RateLimitBucket>();

type RateLimitRedisStore = {
  client?: Redis;
  warnedFallback: boolean;
};

declare global {
  var __sfeRateLimitRedisStore__: RateLimitRedisStore | undefined;
}

function getRateLimitRedisStore() {
  if (!globalThis.__sfeRateLimitRedisStore__) {
    globalThis.__sfeRateLimitRedisStore__ = {
      warnedFallback: false,
    };
  }

  return globalThis.__sfeRateLimitRedisStore__;
}

export const securityRateLimits = {
  authLoginIp: {
    namespace: "auth-login-ip",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  },
  authLoginIdentity: {
    namespace: "auth-login-identity",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  },
  githubConnect: {
    namespace: "github-connect",
    limit: 15,
    windowMs: 10 * 60 * 1000,
  },
  githubCallback: {
    namespace: "github-callback",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  },
  notificationsProcess: {
    namespace: "notifications-process",
    limit: 20,
    windowMs: 60 * 1000,
  },
  analyticsExport: {
    namespace: "analytics-export",
    limit: 15,
    windowMs: 10 * 60 * 1000,
  },
  documentDownload: {
    namespace: "document-download",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  },
} as const;

function normalizeRateLimitKeyPart(value: string) {
  return value.trim().toLowerCase() || "unknown";
}

function buildRateLimitBucketKey(namespace: string, key: string) {
  return `${normalizeRateLimitKeyPart(namespace)}::${normalizeRateLimitKeyPart(key)}`;
}

function buildRedisRateLimitKey(namespace: string, key: string) {
  return `rate-limit:${buildRateLimitBucketKey(namespace, key)}`;
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < 500) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function consumeMemoryRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const bucketKey = buildRateLimitBucketKey(options.namespace, options.key);
  const existing = buckets.get(bucketKey);
  const isExpired = !existing || existing.resetAt <= now;
  const bucket: RateLimitBucket = isExpired
    ? {
        count: 0,
        resetAt: now + options.windowMs,
      }
    : existing;

  bucket.count += 1;
  buckets.set(bucketKey, bucket);

  const allowed = bucket.count <= options.limit;
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return {
    allowed,
    currentCount: bucket.count,
    limit: options.limit,
    remaining: Math.max(0, options.limit - bucket.count),
    resetAt: new Date(bucket.resetAt),
    retryAfterSeconds,
  };
}

function getRateLimitRedisClient() {
  const env = getAppEnv();

  if (!env.REDIS_ENABLED) {
    return null;
  }

  const store = getRateLimitRedisStore();

  if (!store.client) {
    store.client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      connectionName: "gestion-stagiaires-rate-limit",
      retryStrategy: () => null,
    });
    store.client.on("error", (error) => {
      if (store.warnedFallback) {
        return;
      }

      store.warnedFallback = true;
      logger.warn("rate_limit.redis.error_fallback_memory", { error });
    });
  }

  return store.client;
}

async function consumeRedisRateLimit(options: RateLimitOptions): Promise<RateLimitResult | null> {
  const client = getRateLimitRedisClient();

  if (!client) {
    return null;
  }

  const now = Date.now();
  const redisKey = buildRedisRateLimitKey(options.namespace, options.key);

  try {
    if (client.status === "wait" || client.status === "end") {
      await client.connect();
    }

    const count = await client.incr(redisKey);

    if (count === 1) {
      await client.pexpire(redisKey, options.windowMs);
    }

    let ttlMs = await client.pttl(redisKey);

    if (ttlMs < 0) {
      await client.pexpire(redisKey, options.windowMs);
      ttlMs = options.windowMs;
    }

    const allowed = count <= options.limit;
    const retryAfterSeconds = Math.max(1, Math.ceil(ttlMs / 1000));

    return {
      allowed,
      currentCount: count,
      limit: options.limit,
      remaining: Math.max(0, options.limit - count),
      resetAt: new Date(now + ttlMs),
      retryAfterSeconds,
    };
  } catch (error) {
    const store = getRateLimitRedisStore();

    if (!store.warnedFallback) {
      store.warnedFallback = true;
      logger.warn("rate_limit.redis.unavailable_fallback_memory", { error });
    }

    return null;
  }
}

export async function consumeRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const redisResult = await consumeRedisRateLimit(options);

  return redisResult ?? consumeMemoryRateLimit(options);
}

export async function resetRateLimit(options: Pick<RateLimitOptions, "namespace" | "key">) {
  buckets.delete(buildRateLimitBucketKey(options.namespace, options.key));

  const client = getRateLimitRedisClient();

  if (!client) {
    return;
  }

  try {
    if (client.status === "wait" || client.status === "end") {
      await client.connect();
    }

    await client.del(buildRedisRateLimitKey(options.namespace, options.key));
  } catch (error) {
    logger.warn("rate_limit.redis.reset_failed", { error });
  }
}

export function clearAllRateLimits() {
  buckets.clear();
}
