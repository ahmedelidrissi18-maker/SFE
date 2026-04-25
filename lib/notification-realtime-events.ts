export const NOTIFICATION_REALTIME_EVENT_NAME = "sfe:notifications-realtime";

export type RealtimeNotificationRecord = {
  id: string;
  type: string;
  titre: string;
  message: string;
  lien: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationRealtimeEvent =
  | {
      kind: "notification_created";
      userId: string;
      unreadCount?: number;
      unreadCountDelta?: number;
      notificationId: string;
      notificationType: string;
      notification: RealtimeNotificationRecord;
    }
  | {
      kind: "notification_read";
      userId: string;
      unreadCount?: number;
      unreadCountDelta?: number;
      notificationId?: string;
    }
  | {
      kind: "preferences_updated";
      userId: string;
      eventType?: string;
      inAppEnabled?: boolean;
      liveEnabled?: boolean;
    };
