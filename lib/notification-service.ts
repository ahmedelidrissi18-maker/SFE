import {
  createNotification,
  enqueueNotificationDispatchJob,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { publishNotificationRealtimeEvent } from "@/lib/realtime-notifications";
import type { NotificationServiceContract } from "@/lib/services/contracts";

export const notificationService: NotificationServiceContract = {
  async publish(event) {
    if (event.recipients.length > 2) {
      await enqueueNotificationDispatchJob({
        eventType: event.type,
        title: typeof event.payload === "object" && event.payload && "title" in event.payload
          ? String(event.payload.title)
          : "Notification",
        message: typeof event.payload === "object" && event.payload && "message" in event.payload
          ? String(event.payload.message)
          : "Nouvel evenement de notification.",
        link:
          typeof event.payload === "object" && event.payload && "link" in event.payload
            ? String(event.payload.link)
            : undefined,
        recipientIds: event.recipients,
        payload: (event.payload ?? null) as never,
      });

      return {
        delivered: 0,
        deduplicated: 0,
      };
    }

    const title =
      typeof event.payload === "object" && event.payload && "title" in event.payload
        ? String(event.payload.title)
        : "Notification";
    const message =
      typeof event.payload === "object" && event.payload && "message" in event.payload
        ? String(event.payload.message)
        : "Nouvel evenement de notification.";
    const link =
      typeof event.payload === "object" && event.payload && "link" in event.payload
        ? String(event.payload.link)
        : undefined;
    const results = await Promise.all(
      event.recipients.map((userId) =>
        createNotification({
          destinataireId: userId,
          type: event.type,
          titre: title,
          message,
          lien: link,
        }),
      ),
    );
    const delivered = results.filter((result) => result !== null).length;

    return {
      delivered,
      deduplicated: 0,
    };
  },

  async subscribe(input) {
    return {
      ok: true,
      channel: `${input.channel}:${input.userId}`,
    };
  },

  async updatePreferences(input) {
    await prisma.notificationPreference.upsert({
      where: {
        userId_eventType: {
          userId: input.userId,
          eventType: input.eventType,
        },
      },
      create: {
        userId: input.userId,
        eventType: input.eventType,
        inAppEnabled: input.inAppEnabled,
        liveEnabled: input.liveEnabled,
      },
      update: {
        inAppEnabled: input.inAppEnabled,
        liveEnabled: input.liveEnabled,
      },
    });

    publishNotificationRealtimeEvent({
      kind: "preferences_updated",
      userId: input.userId,
      eventType: input.eventType,
      inAppEnabled: input.inAppEnabled,
      liveEnabled: input.liveEnabled,
    });

    return {
      ok: true,
      eventType: input.eventType,
      inAppEnabled: input.inAppEnabled,
      liveEnabled: input.liveEnabled,
    };
  },

  async markAsRead(notificationId, userId) {
    const updateResult = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        destinataireId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    publishNotificationRealtimeEvent({
      kind: "notification_read",
      userId,
      unreadCountDelta: updateResult.count > 0 ? -updateResult.count : 0,
      notificationId,
    });
  },
};
