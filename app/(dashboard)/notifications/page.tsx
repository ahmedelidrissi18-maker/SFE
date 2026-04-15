import Link from "next/link";
import { BellRing, CheckCheck, Clock3 } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateNotificationPreferenceAction,
} from "@/app/(dashboard)/notifications/actions";
import { LiveNotificationsListener } from "@/components/features/notifications/live-notifications-listener";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  ensureEndingSoonNotifications,
  getNotificationTypeLabel,
  notificationEventDefinitions,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/stagiaires";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  await ensureEndingSoonNotifications();

  const notifications = await prisma.notification.findMany({
    where: {
      destinataireId: session.user.id,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const existingPreferences = await prisma.notificationPreference.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: [{ eventType: "asc" }],
  });

  const preferenceByType = new Map(
    existingPreferences.map((preference) => [preference.eventType, preference]),
  );

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="space-y-8">
      <LiveNotificationsListener />
      <PageHeader
        eyebrow="Notifications"
        title="Centre de notifications"
        description="Suivez les evenements importants, les rapports a traiter et les echeances qui demandent votre attention sans quitter votre perimetre."
        actions={
          <form action={markAllNotificationsReadAction}>
            <button
              type="submit"
              className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Tout marquer comme lu
            </button>
          </form>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Notifications"
          value={notifications.length}
          helper="Tous les evenements visibles dans votre espace"
          accent={<BellRing className="h-5 w-5" />}
        />
        <MetricCard
          label="Non lues"
          value={unreadCount}
          helper="Elements qui demandent encore une lecture"
          accent={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Derniere mise a jour"
          value={notifications[0] ? formatDate(notifications[0].createdAt) : "Aucune"}
          helper="Horodatage de la notification la plus recente"
          accent={<CheckCheck className="h-5 w-5" />}
        />
      </section>

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
                className="rounded-[22px] border border-border bg-background p-4"
              >
                <input type="hidden" name="eventType" value={eventDefinition.type} />
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">{eventDefinition.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {eventDefinition.description}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Centre in-app</span>
                      <select
                        name="inAppEnabled"
                        defaultValue={String(preference?.inAppEnabled ?? true)}
                        className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none transition focus:border-primary"
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
                        className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none transition focus:border-primary"
                      >
                        <option value="true">Active</option>
                        <option value="false">Desactive</option>
                      </select>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-primary hover:text-primary"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      </Card>

      {notifications.length > 0 ? (
        <div className="grid gap-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.isRead ? "border-border/70" : "border-primary/30 bg-linear-to-br from-card via-card to-accent/35"}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      {getNotificationTypeLabel(notification.type)}
                    </span>
                    {!notification.isRead ? (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Non lue
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Lue
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">{notification.titre}</h2>
                  <p className="text-sm leading-6 text-muted">{notification.message}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    Creee le {formatDate(notification.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {notification.lien ? (
                    <Link
                      href={notification.lien}
                      className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      Ouvrir
                    </Link>
                  ) : null}

                  {!notification.isRead ? (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:border-primary hover:text-primary"
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
          title="Aucune notification pour le moment"
          description="Les alertes importantes et les rappels de traitement apparaitront ici automatiquement selon votre role et les actions en cours."
        />
      )}
    </div>
  );
}
