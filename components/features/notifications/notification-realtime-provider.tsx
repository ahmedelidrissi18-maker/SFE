"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import type { NotificationRealtimeEvent } from "@/lib/notification-realtime-events";
import {
  applyNotificationRealtimeEvent,
  syncNotificationRealtimeUnreadCount,
} from "@/components/features/notifications/notification-realtime-store";

type NotificationRealtimeProviderProps = {
  children: ReactNode;
  initialUnreadCount: number;
};

export function NotificationRealtimeProvider({
  children,
  initialUnreadCount,
}: NotificationRealtimeProviderProps) {
  useEffect(() => {
    syncNotificationRealtimeUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (event) => {
      try {
        applyNotificationRealtimeEvent(JSON.parse(event.data) as NotificationRealtimeEvent);
      } catch {
        return;
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return <>{children}</>;
}
