"use client";

import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useNotificationRealtimeSelector } from "@/components/features/notifications/notification-realtime-store";

export function LiveNotificationLink() {
  const unreadCount = useNotificationRealtimeSelector((state) => state.unreadCount);

  return (
    <Link
      href="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors"
      aria-label="Ouvrir les notifications"
    >
      <MaterialSymbol icon="notifications" className="text-[20px]" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
