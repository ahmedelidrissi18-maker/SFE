import {
  createNotification,
  enqueueNotificationDispatchJob,
  processPendingNotificationDispatchJobs,
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

      const result = await processPendingNotificationDispatchJobs(5);

      return {
        delivered: result.processed,
        deduplicated: 0,
      };
    }

    let delivered = 0;

    for (const userId of event.recipients) {
      await createNotification({
        destinataireId: userId,
        type: event.type,
        titre:
          typeof event.payload === "object" && event.payload && "title" in event.payload
            ? String(event.payload.title)
            : "Notification",
        message:
          typeof event.payload === "object" && event.payload && "message" in event.payload
            ? String(event.payload.message)
            : "Nouvel evenement de notification.",
        lien:
          typeof event.payload === "object" && event.payload && "link" in event.payload
            ? String(event.payload.link)
            : undefined,
      });
      delivered += 1;
    }

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
    });

    return {
      ok: true,
      eventType: input.eventType,
      inAppEnabled: input.inAppEnabled,
      liveEnabled: input.liveEnabled,
    };
  },

  async markAsRead(notificationId, userId) {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        destinataireId: userId,
      },
      data: {
        isRead: true,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        destinataireId: userId,
        isRead: false,
      },
    });

    publishNotificationRealtimeEvent({
      kind: "notification_read",
      userId,
      unreadCount,
      notificationId,
    });
  },
};
