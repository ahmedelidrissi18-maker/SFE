import type { NotificationRealtimeEvent } from "@/lib/notification-realtime-events";
import { getAppEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { publishRedisJson, registerRedisJsonHandler } from "@/lib/redis";

type NotificationSubscriber = {
  id: string;
  send: (event: NotificationRealtimeEvent) => void;
};

const notificationSubscribers = new Map<string, Map<string, NotificationSubscriber>>();
const realtimeInstanceId = crypto.randomUUID();
const redisChannelName = `${getAppEnv().REDIS_CHANNEL_PREFIX}:notifications:realtime`;
let hasInitializedRedisRealtimeSubscription = false;

type RedisRealtimeEnvelope = {
  originInstanceId: string;
  event: NotificationRealtimeEvent;
};

function getUserChannel(userId: string) {
  const existingChannel = notificationSubscribers.get(userId);

  if (existingChannel) {
    return existingChannel;
  }

  const channel = new Map<string, NotificationSubscriber>();
  notificationSubscribers.set(userId, channel);
  return channel;
}

function fanOutNotificationEvent(event: NotificationRealtimeEvent) {
  const channel = notificationSubscribers.get(event.userId);

  if (!channel) {
    return;
  }

  for (const subscriber of channel.values()) {
    subscriber.send(event);
  }
}

function ensureRedisRealtimeSubscription() {
  if (hasInitializedRedisRealtimeSubscription) {
    return;
  }

  hasInitializedRedisRealtimeSubscription = true;
  registerRedisJsonHandler(redisChannelName, (payload) => {
    const envelope = payload as RedisRealtimeEnvelope;

    if (!envelope?.event || envelope.originInstanceId === realtimeInstanceId) {
      return;
    }

    fanOutNotificationEvent(envelope.event);
  });
}

export function subscribeToNotificationEvents(
  userId: string,
  subscriber: NotificationSubscriber,
) {
  ensureRedisRealtimeSubscription();
  const channel = getUserChannel(userId);
  channel.set(subscriber.id, subscriber);

  return () => {
    channel.delete(subscriber.id);

    if (channel.size === 0) {
      notificationSubscribers.delete(userId);
    }
  };
}

export function publishNotificationRealtimeEvent(event: NotificationRealtimeEvent) {
  fanOutNotificationEvent(event);

  void publishRedisJson(redisChannelName, {
    originInstanceId: realtimeInstanceId,
    event,
  } satisfies RedisRealtimeEnvelope).catch((error) => {
    logger.warn("notifications.realtime.redis_publish_failed", {
      userId: event.userId,
      kind: event.kind,
      error,
    });
  });
}
