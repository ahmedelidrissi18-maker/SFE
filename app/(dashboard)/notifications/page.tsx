import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateNotificationPreferenceAction,
} from "@/app/(dashboard)/notifications/actions";
import { NotificationsLiveFeed } from "@/components/features/notifications/notifications-live-feed";
import { Card } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPaginationMeta, parsePageParam } from "@/lib/pagination";
import { notificationEventDefinitions } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type NotificationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type NotificationSectionParams = Record<string, string | string[] | undefined>;

type NotificationsFeedSectionProps = {
  currentPage: number;
  pageSize: number;
  searchParams: NotificationSectionParams;
  userId: string;
};

type NotificationPreferencesSectionProps = {
  userId: string;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function NotificationsFeedFallback() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[176px] animate-pulse rounded-[28px] bg-surface-container-low"
          />
        ))}
      </section>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[180px] animate-pulse rounded-[28px] bg-surface-container-low"
          />
        ))}
      </div>
    </div>
  );
}

function NotificationPreferencesFallback() {
  return (
    <Card className="space-y-5">
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded-full bg-surface-container-high" />
        <div className="h-8 w-72 animate-pulse rounded-full bg-surface-container-high" />
        <div className="h-4 w-full animate-pulse rounded-full bg-surface-container-high" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[248px] animate-pulse rounded-[22px] bg-surface-container-low"
          />
        ))}
      </div>
    </Card>
  );
}

async function NotificationsFeedSection({
  currentPage,
  pageSize,
  searchParams,
  userId,
}: NotificationsFeedSectionProps) {
  const [totalNotificationsCount, unreadCount, latestNotification] = await Promise.all([
    prisma.notification.count({
      where: {
        destinataireId: userId,
      },
    }),
    prisma.notification.count({
      where: {
        destinataireId: userId,
        isRead: false,
      },
    }),
    prisma.notification.findFirst({
      where: {
        destinataireId: userId,
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        createdAt: true,
      },
    }),
  ]);

  const pagination = getPaginationMeta({
    requestedPage: currentPage,
    totalItems: totalNotificationsCount,
    pageSize,
  });

  const notifications = await prisma.notification.findMany({
    where: {
      destinataireId: userId,
    },
    orderBy: [{ createdAt: "desc" }],
    skip: pagination.skip,
    take: pagination.take,
  });

  return (
    <>
      <NotificationsLiveFeed
        initialNotifications={notifications.map((notification) => ({
          id: notification.id,
          type: notification.type,
          titre: notification.titre,
          message: notification.message,
          lien: notification.lien,
          isRead: notification.isRead,
          createdAt: notification.createdAt.toISOString(),
        }))}
        initialTotalCount={totalNotificationsCount}
        initialUnreadCount={unreadCount}
        initialLatestCreatedAt={latestNotification?.createdAt.toISOString() ?? null}
        pageSize={pagination.pageSize}
        currentPage={pagination.currentPage}
        markAsReadAction={markNotificationReadAction}
      />

      <PaginationControls
        pathname="/notifications"
        searchParams={searchParams}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        startItem={pagination.startItem}
        endItem={pagination.endItem}
        itemLabel="notifications"
      />
    </>
  );
}

async function NotificationPreferencesSection({ userId }: NotificationPreferencesSectionProps) {
  const existingPreferences = await prisma.notificationPreference.findMany({
    where: {
      userId,
    },
    orderBy: [{ eventType: "asc" }],
  });
  const preferenceByType = new Map(
    existingPreferences.map((preference) => [preference.eventType, preference]),
  );

  return (
    <Card className="space-y-5">
      <div>
        <p className="text-sm font-medium text-primary">Preferences</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          Diffusion temps reel et in-app
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Choisissez les evenements qui doivent apparaitre dans votre centre de notifications
          et ceux qui doivent declencher une mise a jour live de votre interface.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {notificationEventDefinitions.map((eventDefinition) => {
          const preference = preferenceByType.get(eventDefinition.type);

          return (
            <form
              key={eventDefinition.type}
              action={updateNotificationPreferenceAction}
              className="tonal-card rounded-[22px] p-4"
            >
              <input type="hidden" name="eventType" value={eventDefinition.type} />
              <div className="space-y-3">
                <div>
                  <p className="font-semibold">{eventDefinition.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {eventDefinition.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted">Centre in-app</span>
                    <StatusBadge status={preference?.inAppEnabled ?? true ? "Active" : "Desactive"} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted">Live</span>
                    <StatusBadge status={preference?.liveEnabled ?? true ? "Active" : "Desactive"} />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium">Centre in-app</span>
                    <select
                      name="inAppEnabled"
                      defaultValue={String(preference?.inAppEnabled ?? true)}
                      className="field-shell w-full rounded-2xl px-4 py-3 outline-none transition"
                    >
                      <option value="true">Active</option>
                      <option value="false">Desactive</option>
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium">Mise a jour live</span>
                    <select
                      name="liveEnabled"
                      defaultValue={String(preference?.liveEnabled ?? true)}
                      className="field-shell w-full rounded-2xl px-4 py-3 outline-none transition"
                    >
                      <option value="true">Active</option>
                      <option value="false">Desactive</option>
                    </select>
                  </label>
                </div>

                <button
                  type="submit"
                  className="action-button action-button-secondary px-4 py-2.5 text-sm"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </Card>
  );
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const success = getStringParam(params.success)?.trim() ?? "";
  const requestedPage = parsePageParam(params.page);
  const pageSize = 10;

  return (
    <div className="space-y-8">
      {success === "all-read" ? (
        <FeedbackBanner
          title="Notifications mises a jour"
          message="Toutes les notifications ont ete marquees comme lues."
          description="Le compteur et la liste ont ete synchronises."
        />
      ) : null}
      {success === "preferences-updated" ? (
        <FeedbackBanner
          title="Preferences enregistrees"
          message="Les preferences de notification ont ete mises a jour."
          description="Les nouveaux reglages s appliqueront aux prochains evenements."
        />
      ) : null}

      <PageHeader
        eyebrow="Notifications"
        title="Centre de notifications"
        description="Suivez les evenements importants, les rapports a traiter et les echeances qui demandent votre attention sans quitter votre perimetre."
        actions={
          <form action={markAllNotificationsReadAction}>
            <button
              type="submit"
              className="action-button action-button-secondary px-5 py-3 text-sm"
            >
              Tout marquer comme lu
            </button>
          </form>
        }
      />

      <Suspense fallback={<NotificationsFeedFallback />}>
        <NotificationsFeedSection
          currentPage={requestedPage}
          pageSize={pageSize}
          searchParams={params}
          userId={session.user.id}
        />
      </Suspense>

      <Suspense fallback={<NotificationPreferencesFallback />}>
        <NotificationPreferencesSection userId={session.user.id} />
      </Suspense>
    </div>
  );
}
