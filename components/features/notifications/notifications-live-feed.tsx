"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { markNotificationReadAction } from "@/app/(dashboard)/notifications/actions";
import {
  hydrateNotificationRealtimeFeed,
  useNotificationRealtimeSelector,
} from "@/components/features/notifications/notification-realtime-store";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RealtimeNotificationRecord } from "@/lib/notification-realtime-events";
import { getNotificationTypeLabel } from "@/lib/notifications";
import { formatDate } from "@/lib/stagiaires";

type NotificationsLiveFeedProps = {
  initialNotifications: RealtimeNotificationRecord[];
  initialTotalCount: number;
  initialUnreadCount: number;
  initialLatestCreatedAt: string | null;
  pageSize: number;
  currentPage: number;
  markAsReadAction: typeof markNotificationReadAction;
};

function getLatestUpdateLabel(latestCreatedAt: string | null) {
  if (!latestCreatedAt) {
    return "Aucune";
  }

  const parsedDate = new Date(latestCreatedAt);

  return Number.isNaN(parsedDate.getTime()) ? "Aucune" : formatDate(parsedDate);
}

export function NotificationsLiveFeed({
  initialNotifications,
  initialTotalCount,
  initialUnreadCount,
  initialLatestCreatedAt,
  pageSize,
  currentPage,
  markAsReadAction,
}: NotificationsLiveFeedProps) {
  const notifications = useNotificationRealtimeSelector((state) => state.notifications);
  const totalCount = useNotificationRealtimeSelector((state) => state.totalCount);
  const unreadCount = useNotificationRealtimeSelector((state) => state.unreadCount);
  const latestCreatedAt = useNotificationRealtimeSelector((state) => state.latestCreatedAt);

  useEffect(() => {
    hydrateNotificationRealtimeFeed({
      notifications: initialNotifications,
      totalCount: initialTotalCount,
      unreadCount: initialUnreadCount,
      latestCreatedAt: initialLatestCreatedAt,
      currentPage,
      pageSize,
    });
  }, [
    currentPage,
    initialLatestCreatedAt,
    initialNotifications,
    initialTotalCount,
    initialUnreadCount,
    pageSize,
  ]);

  const latestUpdateLabel = getLatestUpdateLabel(latestCreatedAt);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Notifications"
          value={totalCount}
          helper="Tous les evenements visibles dans votre espace"
          accent={<MaterialSymbol icon="notifications" className="text-[20px]" filled />}
        />
        <MetricCard
          label="Non lues"
          value={unreadCount}
          helper="Elements qui demandent encore une lecture"
          accent={<MaterialSymbol icon="schedule" className="text-[20px]" />}
        />
        <MetricCard
          label="Derniere mise a jour"
          value={latestUpdateLabel}
          helper="Horodatage de la notification la plus recente"
          accent={<MaterialSymbol icon="done_all" className="text-[20px]" />}
        />
      </section>

      {notifications.length > 0 ? (
        <div className="grid gap-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={
                notification.isRead
                  ? "bg-card"
                  : "bg-linear-to-br from-card via-card to-accent/35"
              }
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      {getNotificationTypeLabel(notification.type)}
                    </span>
                    <StatusBadge status={notification.isRead ? "Lue" : "Non lue"} />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">{notification.titre}</h2>
                  <p className="text-sm leading-6 text-muted">{notification.message}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    Creee le {getLatestUpdateLabel(notification.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {notification.lien ? (
                    <Link
                      href={notification.lien}
                      className="action-button action-button-primary px-4 py-2.5 text-sm"
                    >
                      Ouvrir
                    </Link>
                  ) : null}

                  {!notification.isRead ? (
                    <form action={markAsReadAction}>
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <button
                        type="submit"
                        className="action-button action-button-secondary px-4 py-2.5 text-sm"
                      >
                        Marquer comme lue
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="Notifications"
          title="Aucune notification pour le moment"
          description="Les alertes importantes et les rappels de traitement apparaitront ici automatiquement selon votre role et les actions en cours."
          actionHref="/dashboard"
          actionLabel="Retour au dashboard"
        />
      )}
    </>
  );
}
