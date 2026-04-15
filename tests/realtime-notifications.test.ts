import { describe, expect, it, vi } from "vitest";
import {
  publishNotificationRealtimeEvent,
  subscribeToNotificationEvents,
} from "@/lib/realtime-notifications";

describe("realtime notifications", () => {
  it("publishes events only to subscribers of the matching user", () => {
    const firstSubscriber = {
      id: "subscriber-1",
      send: vi.fn(),
    };
    const secondSubscriber = {
      id: "subscriber-2",
      send: vi.fn(),
    };

    const unsubscribe = subscribeToNotificationEvents("user-1", firstSubscriber);
    subscribeToNotificationEvents("user-2", secondSubscriber);

    publishNotificationRealtimeEvent({
      kind: "notification_created",
      userId: "user-1",
      unreadCount: 3,
      notificationId: "notification-1",
      notificationType: "RAPPORT_SUBMITTED",
    });

    expect(firstSubscriber.send).toHaveBeenCalledTimes(1);
    expect(secondSubscriber.send).not.toHaveBeenCalled();

    unsubscribe();
  });
});
