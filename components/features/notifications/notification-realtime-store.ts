"use client";

import { useSyncExternalStore } from "react";
import type { NotificationRealtimeEvent, RealtimeNotificationRecord } from "@/lib/notification-realtime-events";

type NotificationRealtimeState = {
  unreadCount: number;
  totalCount: number;
  latestCreatedAt: string | null;
  notifications: RealtimeNotificationRecord[];
  currentPage: number;
  pageSize: number;
};

export type NotificationRealtimeFeedHydration = {
  notifications: RealtimeNotificationRecord[];
  totalCount: number;
  unreadCount: number;
  latestCreatedAt: string | null;
  currentPage: number;
  pageSize: number;
};

type NotificationRealtimeListener = () => void;

const listeners = new Set<NotificationRealtimeListener>();

let notificationRealtimeState: NotificationRealtimeState = {
  unreadCount: 0,
  totalCount: 0,
  latestCreatedAt: null,
  notifications: [],
  currentPage: 1,
  pageSize: 10,
};

function applyUnreadDelta(
  currentCount: number,
  event: {
    unreadCount?: number;
    unreadCountDelta?: number;
  },
) {
  if (typeof event.unreadCount === "number") {
    return Math.max(0, event.unreadCount);
  }

  if (typeof event.unreadCountDelta === "number") {
    return Math.max(0, currentCount + event.unreadCountDelta);
  }

  return currentCount;
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setNotificationRealtimeState(
  nextState:
    | NotificationRealtimeState
    | ((currentState: NotificationRealtimeState) => NotificationRealtimeState),
) {
  const resolvedState =
    typeof nextState === "function" ? nextState(notificationRealtimeState) : nextState;

  if (Object.is(resolvedState, notificationRealtimeState)) {
    return;
  }

  notificationRealtimeState = resolvedState;
  emitChange();
}

function subscribeToNotificationRealtimeStore(listener: NotificationRealtimeListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getNotificationRealtimeSnapshot() {
  return notificationRealtimeState;
}

export function useNotificationRealtimeSelector<Value>(
  selector: (state: NotificationRealtimeState) => Value,
) {
  return useSyncExternalStore(
    subscribeToNotificationRealtimeStore,
    () => selector(getNotificationRealtimeSnapshot()),
    () => selector(getNotificationRealtimeSnapshot()),
  );
}

export function syncNotificationRealtimeUnreadCount(unreadCount: number) {
  setNotificationRealtimeState((currentState) => ({
    ...currentState,
    unreadCount: Math.max(0, unreadCount),
  }));
}

export function hydrateNotificationRealtimeFeed(input: NotificationRealtimeFeedHydration) {
  setNotificationRealtimeState((currentState) => ({
    ...currentState,
    notifications: input.notifications,
    totalCount: input.totalCount,
    unreadCount: Math.max(0, input.unreadCount),
    latestCreatedAt: input.latestCreatedAt,
    currentPage: input.currentPage,
    pageSize: input.pageSize,
  }));
}

export function applyNotificationRealtimeEvent(event: NotificationRealtimeEvent) {
  if (event.kind === "preferences_updated") {
    return;
  }

  if (event.kind === "notification_created") {
    setNotificationRealtimeState((currentState) => {
      const notificationAlreadyKnown = currentState.notifications.some(
        (notification) => notification.id === event.notification.id,
      );
      const unreadCount = applyUnreadDelta(currentState.unreadCount, event);
      const totalCount = notificationAlreadyKnown ? currentState.totalCount : currentState.totalCount + 1;
      const latestCreatedAt = event.notification.createdAt;

      if (currentState.currentPage !== 1) {
        return {
          ...currentState,
          unreadCount,
          totalCount,
          latestCreatedAt,
        };
      }

      return {
        ...currentState,
        unreadCount,
        totalCount,
        latestCreatedAt,
        notifications: [
          event.notification,
          ...currentState.notifications.filter((notification) => notification.id !== event.notification.id),
        ].slice(0, currentState.pageSize),
      };
    });
    return;
  }

  setNotificationRealtimeState((currentState) => {
    const unreadCount = applyUnreadDelta(currentState.unreadCount, event);

    if (!event.notificationId) {
      return {
        ...currentState,
        unreadCount,
        notifications: currentState.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      };
    }

    return {
      ...currentState,
      unreadCount,
      notifications: currentState.notifications.map((notification) =>
        notification.id === event.notificationId
          ? {
              ...notification,
              isRead: true,
            }
          : notification,
      ),
    };
  });
}
