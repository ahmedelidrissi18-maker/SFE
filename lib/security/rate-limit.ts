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

export function consumeRateLimit(options: RateLimitOptions): RateLimitResult {
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

export function resetRateLimit(options: Pick<RateLimitOptions, "namespace" | "key">) {
  buckets.delete(buildRateLimitBucketKey(options.namespace, options.key));
}

export function clearAllRateLimits() {
  buckets.clear();
}

