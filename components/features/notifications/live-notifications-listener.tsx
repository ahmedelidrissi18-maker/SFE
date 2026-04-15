"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveNotificationsListener() {
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          kind?: string;
        };

        if (
          payload.kind === "notification_created" ||
          payload.kind === "notification_read" ||
          payload.kind === "preferences_updated"
        ) {
          router.refresh();
        }
      } catch {
        return;
      }
    };

    return () => {
      eventSource.close();
    };
  }, [router]);

  return null;
}
