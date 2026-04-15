type NotificationRealtimeEvent =
  | {
      kind: "notification_created";
      userId: string;
      unreadCount: number;
      notificationId: string;
      notificationType: string;
    }
  | {
      kind: "notification_read";
      userId: string;
      unreadCount: number;
      notificationId?: string;
    }
  | {
      kind: "preferences_updated";
      userId: string;
    };

type NotificationSubscriber = {
  id: string;
  send: (event: NotificationRealtimeEvent) => void;
};

const notificationSubscribers = new Map<string, Map<string, NotificationSubscriber>>();

function getUserChannel(userId: string) {
  const existingChannel = notificationSubscribers.get(userId);

  if (existingChannel) {
    return existingChannel;
  }

  const channel = new Map<string, NotificationSubscriber>();
  notificationSubscribers.set(userId, channel);
  return channel;
}

export function subscribeToNotificationEvents(
  userId: string,
  subscriber: NotificationSubscriber,
) {
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
  const channel = notificationSubscribers.get(event.userId);

  if (!channel) {
    return;
  }

  for (const subscriber of channel.values()) {
    subscriber.send(event);
  }
}
