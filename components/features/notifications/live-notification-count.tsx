"use client";

import { useNotificationRealtimeSelector } from "@/components/features/notifications/notification-realtime-store";

export function LiveNotificationCount() {
  const unreadCount = useNotificationRealtimeSelector((state) => state.unreadCount);

  return <>{unreadCount}</>;
}
