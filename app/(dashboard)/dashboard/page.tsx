import Link from "next/link";
import { FileClock, FolderKanban, ShieldCheck, TimerReset, Users } from "lucide-react";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { LiveNotificationsListener } from "@/components/features/notifications/live-notifications-listener";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { getRapportStatusLabel } from "@/lib/rapports";
import { formatDate } from "@/lib/stagiaires";
import { ACTIVE_STAGE_STATUSES, getStageStatusLabel } from "@/lib/stages";

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const now = new Date();
  const soonDate = new Date(now);
  soonDate.setDate(soonDate.getDate() + 15);

  const role = session.user.role;

  const stageVisibilityFilter =
    role === "ENCADRANT"
      ? { encadrantId: session.user.id }
      : role === "STAGIAIRE"
        ? {
            stagiaire: {
              userId: session.user.id,
            },
          }
        : {};

  const rapportVisibilityFilter =
    role === "ENCADRANT"
      ? {
          stage: {
            encadrantId: session.user.id,
          },
        }
      : role === "STAGIAIRE"
        ? {
            stage: {
              stagiaire: {
                userId: session.user.id,
              },
            },
          }
        : {};

  const [
    activeStagiairesCount,
    activeStagesCount,
    pendingRapportsCount,
    unreadNotificationsCount,
    documentsCount,
    encadrantsCount,
    recentRapports,
    endingSoonStages,
    myActiveStage,
  ] = await Promise.all([
    prisma.stagiaire.count({
      where: {
        user: {
          role: Role.STAGIAIRE,
          isActive: true,
        },
      },
    }),
    prisma.stage.count({
      where: {
        ...stageVisibilityFilter,
        statut: {
          in: ACTIVE_STAGE_STATUSES,
        },
      },
    }),
    prisma.rapport.count({
      where: {
        ...rapportVisibilityFilter,
        statut: "SOUMIS",
      },
    }),
    prisma.notification.count({
      where: {
        destinataireId: session.user.id,
        isRead: false,
      },
    }),
    prisma.document.count({
      where: {
        isDeleted: false,
        stage: stageVisibilityFilter,
      },
    }),
    prisma.user.count({
      where: {
        role: Role.ENCADRANT,
        isActive: true,
      },
    }),
    prisma.rapport.findMany({
      where: rapportVisibilityFilter,
      include: {
        stage: {
          include: {
            stagiaire: {
              include: {
                user: true,
              },
            },
            encadrant: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 5,
    }),
    prisma.stage.findMany({
      where: {
        ...stageVisibilityFilter,
        statut: {
          in: ACTIVE_STAGE_STATUSES,
        },
        dateFin: {
          gte: now,
          lte: soonDate,
        },
      },
      include: {
        stagiaire: {
          include: {
            user: true,
          },
        },
        encadrant: true,
      },
      orderBy: [{ dateFin: "asc" }],
      take: 5,
    }),
    role === "STAGIAIRE"
      ? prisma.stage.findFirst({
          where: {
            ...stageVisibilityFilter,
            statut: {
              in: ACTIVE_STAGE_STATUSES,
            },
          },
          include: {
            encadrant: true,
            documents: {
              where: {
                isDeleted: false,
              },
            },
          },
          orderBy: [{ dateDebut: "desc" }],
        })
      : Promise.resolve(null),
  ]);

  const metrics =
    role === "STAGIAIRE"
      ? [
          {
            label: "Mon stage",
            value: myActiveStage ? getStageStatusLabel(myActiveStage.statut) : "Aucun",
            helper: "Statut de votre stage actuellement visible",
            accent: <FolderKanban className="h-5 w-5" />,
          },
          {
            label: "Rapports a traiter",
            value: String(pendingRapportsCount),
            helper: "Rapports encore en attente de revue ou de retour",
            accent: <FileClock className="h-5 w-5" />,
          },
          {
            label: "Documents",
            value: String(myActiveStage?.documents.length ?? 0),
            helper: "Documents disponibles sur votre stage actif",
            accent: <ShieldCheck className="h-5 w-5" />,
          },
          {
            label: "Fin previsionnelle",
            value: myActiveStage ? formatDate(myActiveStage.dateFin) : "-",
            helper: "Date cible de cloture du stage",
            accent: <TimerReset className="h-5 w-5" />,
          },
        ]
      : role === "ENCADRANT"
        ? [
            {
              label: "Mes stages actifs",
              value: String(activeStagesCount),
              helper: "Stages en cours, planifies ou suspendus dans votre perimetre",
              accent: <FolderKanban className="h-5 w-5" />,
            },
            {
              label: "Rapports a relire",
              value: String(pendingRapportsCount),
              helper: "Rapports soumis qui attendent votre retour",
              accent: <FileClock className="h-5 w-5" />,
            },
            {
              label: "Fin proche",
              value: String(endingSoonStages.length),
              helper: "Stages qui se terminent sous 15 jours",
              accent: <TimerReset className="h-5 w-5" />,
            },
            {
              label: "Notifications",
              value: String(unreadNotificationsCount),
              helper: "Notifications non lues dans votre espace",
              accent: <ShieldCheck className="h-5 w-5" />,
            },
          ]
        : [
            {
              label: "Stagiaires actifs",
              value: String(activeStagiairesCount),
              helper: "Comptes stagiaires actifs prets pour le suivi",
              accent: <Users className="h-5 w-5" />,
            },
            {
              label: "Stages actifs",
              value: String(activeStagesCount),
              helper: "Planifies, en cours ou suspendus selon les donnees reelles",
              accent: <FolderKanban className="h-5 w-5" />,
            },
            {
              label: "Rapports a relire",
              value: String(pendingRapportsCount),
              helper: "Rapports soumis en attente de validation ou retour",
              accent: <FileClock className="h-5 w-5" />,
            },
            {
              label: "Encadrants actifs",
              value: String(encadrantsCount),
              helper: `${documentsCount} documents stockes et relies aux stages`,
              accent: <ShieldCheck className="h-5 w-5" />,
            },
          ];

  return (
    <div className="space-y-8">
      <LiveNotificationsListener />
      <PageHeader
        eyebrow="Dashboard"
        title="Pilotage en temps reel de la V1"
        description="Les indicateurs et les sections ci-dessous sont relies aux donnees reelles de la plateforme pour suivre les rapports, les stages visibles dans votre perimetre et les echeances a venir."
        actions={
          <>
            <Link
              href="/rapports"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Consulter les rapports
            </Link>
            <Link
              href="/notifications"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Ouvrir les notifications
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            accent={metric.accent}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Rapports recents</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Derniere activite visible</h2>
            </div>
            <p className="text-sm text-muted">
              {recentRapports.length} rapport{recentRapports.length > 1 ? "s" : ""} sur la vue actuelle
            </p>
          </div>

          {recentRapports.length > 0 ? (
            <div className="grid gap-3">
              {recentRapports.map((rapport) => (
                <Link
                  key={rapport.id}
                  href={`/rapports/${rapport.id}`}
                  className="rounded-[24px] border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-[0_16px_30px_-24px_rgba(15,118,110,0.5)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={getRapportStatusLabel(rapport.statut)} />
                        <span className="text-xs uppercase tracking-[0.18em] text-muted">
                          Semaine {rapport.semaine}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold">
                        {`${rapport.stage.stagiaire.user.prenom} ${rapport.stage.stagiaire.user.nom}`.trim()}
                      </h3>
                      <p className="text-sm leading-6 text-muted">
                        {rapport.stage.departement} · {rapport.stage.sujet}
                      </p>
                    </div>
                    <div className="text-sm text-muted sm:text-right">
                      <p className="font-medium text-foreground">{rapport.avancement}%</p>
                      <p>Maj {formatShortDate(rapport.updatedAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun rapport recent"
              description="Les nouveaux rapports apparaitront ici des qu une activite sera visible dans votre perimetre."
              actionHref="/rapports"
              actionLabel="Voir tous les rapports"
            />
          )}
        </Card>

        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">Echeances</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Stages bientot termines</h2>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
              Sous 15 jours
            </span>
          </div>

          {endingSoonStages.length > 0 ? (
            <div className="space-y-3">
              {endingSoonStages.map((stage) => (
                <Link
                  key={stage.id}
                  href={`/stagiaires/${stage.stagiaireId}`}
                  className="block rounded-[22px] border border-border bg-background p-4 transition hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {`${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom}`.trim()}
                      </p>
                      <p className="text-sm text-muted">{stage.departement}</p>
                      <p className="text-xs text-muted">
                        Fin le {formatDate(stage.dateFin)}
                      </p>
                    </div>
                    <StatusBadge status={getStageStatusLabel(stage.statut)} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune fin proche"
              description="Aucun stage visible dans votre perimetre ne se termine dans les 15 prochains jours."
              actionHref="/stages"
              actionLabel="Voir les stages"
            />
          )}
        </Card>
      </section>
    </div>
  );
}
