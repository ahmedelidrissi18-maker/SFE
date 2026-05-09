import Redis from "ioredis";
import { getAppEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

type RedisJsonHandler = (payload: unknown) => void;

type RedisStore = {
  publisher?: Redis;
  subscriber?: Redis;
  handlers: Map<string, Set<RedisJsonHandler>>;
  subscribedChannels: Set<string>;
  loggedErrorKeys: Set<string>;
};

declare global {
  var __sfeRedisStore__: RedisStore | undefined;
}

function getRedisStore() {
  if (!globalThis.__sfeRedisStore__) {
    globalThis.__sfeRedisStore__ = {
      handlers: new Map(),
      subscribedChannels: new Set(),
      loggedErrorKeys: new Set(),
    };
  }

  return globalThis.__sfeRedisStore__;
}

function buildRedisClient(connectionName: string) {
  const env = getAppEnv();

  return new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS,
    enableReadyCheck: true,
    enableOfflineQueue: false,
    connectionName,
    retryStrategy: () => null,
  });
}

async function ensurePublisher() {
  const env = getAppEnv();

  if (!env.REDIS_ENABLED) {
    return null;
  }

  const store = getRedisStore();

  if (!store.publisher) {
    store.publisher = buildRedisClient("gestion-stagiaires-publisher");
    store.publisher.on("error", (error) => {
      if (store.loggedErrorKeys.has("publisher")) {
        return;
      }

      store.loggedErrorKeys.add("publisher");
      logger.warn("redis.publisher.error", { error });
    });
  }

  if (store.publisher.status === "wait" || store.publisher.status === "end") {
    await store.publisher.connect();
  }

  return store.publisher;
}

async function ensureSubscriber() {
  const env = getAppEnv();

  if (!env.REDIS_ENABLED) {
    return null;
  }

  const store = getRedisStore();

  if (!store.subscriber) {
    store.subscriber = buildRedisClient("gestion-stagiaires-subscriber");
    store.subscriber.on("error", (error) => {
      if (store.loggedErrorKeys.has("subscriber")) {
        return;
      }

      store.loggedErrorKeys.add("subscriber");
      logger.warn("redis.subscriber.error", { error });
    });
    store.subscriber.on("message", (channel, rawPayload) => {
      const handlers = store.handlers.get(channel);

      if (!handlers || handlers.size === 0) {
        return;
      }

      try {
        const payload = JSON.parse(rawPayload) as unknown;

        for (const handler of handlers) {
          handler(payload);
        }
      } catch (error) {
        logger.warn("redis.subscriber.invalid_payload", {
          channel,
          error,
        });
      }
    });
  }

  if (store.subscriber.status === "wait" || store.subscriber.status === "end") {
    await store.subscriber.connect();
  }

  return store.subscriber;
}

export function isRedisEnabled() {
  return getAppEnv().REDIS_ENABLED;
}

export async function publishRedisJson(channel: string, payload: unknown) {
  const publisher = await ensurePublisher();

  if (!publisher) {
    return false;
  }

  await publisher.publish(channel, JSON.stringify(payload));
  return true;
}

export function registerRedisJsonHandler(channel: string, handler: RedisJsonHandler) {
  if (!isRedisEnabled()) {
    return () => undefined;
  }

  const store = getRedisStore();
  const channelHandlers = store.handlers.get(channel) ?? new Set<RedisJsonHandler>();
  channelHandlers.add(handler);
  store.handlers.set(channel, channelHandlers);

  void (async () => {
    try {
      const subscriber = await ensureSubscriber();

      if (!subscriber || store.subscribedChannels.has(channel)) {
        return;
      }

      await subscriber.subscribe(channel);
      store.subscribedChannels.add(channel);
    } catch (error) {
      logger.warn("redis.subscribe.failed", {
        channel,
        error,
      });
    }
  })();

  return () => {
    const handlers = store.handlers.get(channel);

    if (!handlers) {
      return;
    }

    handlers.delete(handler);

    if (handlers.size === 0) {
      store.handlers.delete(channel);
    }
  };
}

export async function getRedisHealth() {
  const env = getAppEnv();

  if (!env.REDIS_ENABLED) {
    return {
      status: "disabled" as const,
      latencyMs: null,
      detail: "Redis desactive par configuration.",
    };
  }

  const startedAt = Date.now();

  try {
    const publisher = await ensurePublisher();
    const response = await publisher?.ping();

    return {
      status: response === "PONG" ? ("ok" as const) : ("degraded" as const),
      latencyMs: Date.now() - startedAt,
      detail: response === "PONG" ? "Ping Redis OK." : "Redis a repondu de facon inattendue.",
    };
  } catch (error) {
    return {
      status: "down" as const,
      latencyMs: Date.now() - startedAt,
      detail: error instanceof Error ? error.message : "redis_unreachable",
    };
  }
}
