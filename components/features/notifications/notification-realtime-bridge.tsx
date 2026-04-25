"use client";

import { useEffect } from "react";
import type { NotificationRealtimeEvent } from "@/lib/notification-realtime-events";
import { applyNotificationRealtimeEvent } from "@/components/features/notifications/notification-realtime-store";

export function NotificationRealtimeBridge() {
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

  return null;
}
