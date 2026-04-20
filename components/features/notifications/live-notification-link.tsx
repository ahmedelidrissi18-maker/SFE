"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";

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
      className="relative inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-surface-container-low px-3 py-2 text-on-surface shadow-[var(--shadow-soft)] transition hover:bg-surface-container-high hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:px-4"
      aria-label="Ouvrir les notifications"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] bg-surface-container-lowest text-primary">
        <MaterialSymbol icon="notifications" className="text-[18px]" />
      </span>
      <span className="hidden text-sm font-semibold sm:inline">Notifications</span>
      {unreadCount === 0 ? (
        <span className="hidden text-xs text-on-surface-variant lg:inline">Centre d alertes</span>
      ) : null}
      {unreadCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-on-primary shadow-[var(--shadow-soft)]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
