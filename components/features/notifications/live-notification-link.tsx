"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

type LiveNotificationLinkProps = {
  initialUnreadCount: number;
};

type RealtimePayload = {
  kind?: string;
  unreadCount?: number;
};

export function LiveNotificationLink({
  initialUnreadCount,
}: LiveNotificationLinkProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as RealtimePayload;

        if (typeof payload.unreadCount === "number") {
          setUnreadCount(payload.unreadCount);
        }
      } catch {
        return;
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted transition hover:border-primary hover:text-primary"
      aria-label="Ouvrir les notifications"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
