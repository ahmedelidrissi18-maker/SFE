import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  FileClock,
  FolderKanban,
  ShieldCheck,
  TimerReset,
  Users,
} from "lucide-react";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { LiveNotificationsListener } from "@/components/features/notifications/live-notifications-listener";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { getRapportStatusLabel } from "@/lib/rapports";
import { isSensitiveTwoFactorRole } from "@/lib/security/two-factor";
import { formatDate } from "@/lib/stagiaires";
import { ACTIVE_STAGE_STATUSES, getStageStatusLabel } from "@/lib/stages";
import type { UserRole } from "@/types";

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

type QuickAction = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

type PriorityItem = {
  title: string;
  description: string;
  value: ReactNode;
  href: string;
  cta: string;
};

function getRoleIntro(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return {
        eyebrow: "Vue administration",
        title: "Tableau de bord operationnel",
        description:
          "Supervisez les stagiaires actifs, les rapports soumis, les echeances proches et les signaux de vigilance sans quitter votre perimetre de pilotage.",
      };
    case "RH":
      return {
        eyebrow: "Vue RH",
        title: "Pilotage des validations et des suivis",
        description:
          "Reperez en quelques secondes les rapports a relire, les documents visibles et les stages qui demandent une attention RH.",
      };
    case "ENCADRANT":
      return {
        eyebrow: "Vue encadrant",
        title: "Suivi de mes stagiaires",
        description:
          "Accedez rapidement aux rapports a relire, aux stages de votre perimetre et aux echeances a anticiper avec vos stagiaires.",
      };
    case "STAGIAIRE":
      return {
        eyebrow: "Vue stagiaire",
        title: "Mon espace de stage",
        description:
          "Retrouvez votre stage actif, vos rapports soumis, vos documents disponibles et vos prochaines echeances depuis une seule page.",
      };
    default:
      return {
        eyebrow: "Vue application",
        title: "Tableau de bord",
        description: "Consultez les indicateurs essentiels de votre perimetre.",
      };
  }
}

function getQuickActions(role: UserRole): QuickAction[] {
  switch (role) {
    case "ADMIN":
      return [
        { href: "/rapports", label: "Suivre les rapports", variant: "primary" },
        { href: "/analytics", label: "Voir les analytics", variant: "secondary" },
      ];
    case "RH":
      return [
        { href: "/rapports", label: "Traiter les rapports", variant: "primary" },
        { href: "/documents", label: "Voir les documents", variant: "secondary" },
      ];
    case "ENCADRANT":
      return [
        { href: "/stages", label: "Voir mes stages", variant: "primary" },
        { href: "/rapports", label: "Ouvrir les rapports", variant: "secondary" },
      ];
    case "STAGIAIRE":
      return [
        { href: "/rapports", label: "Mes rapports", variant: "primary" },
        { href: "/documents", label: "Mes documents", variant: "secondary" },
      ];
    default:
      return [{ href: "/dashboard", label: "Revenir au dashboard", variant: "primary" }];
  }
}

function getQuickActionClassName(variant: QuickAction["variant"]) {
  return variant === "primary"
    ? "inline-flex min-h-11 items-center justify-center rounded-[20px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_22px_42px_-28px_rgba(15,118,110,0.72)] transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
    : "inline-flex min-h-11 items-center justify-center rounded-[20px] border border-border bg-linear-to-b from-background to-card px-5 py-3 text-sm font-semibold shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card";
}

function getEndingSoonStageHref(role: UserRole, stagiaireId: string) {
  if (role === "ADMIN" || role === "RH") {
    return `/stagiaires/${stagiaireId}`;
  }

  if (role === "ENCADRANT") {
    return "/stages";
  }

  return "/rapports";
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const now = new Date();
  const soonDate = new Date(now);
  soonDate.setDate(soonDate.getDate() + 15);

  const role = session.user.role as UserRole;
  const roleIntro = getRoleIntro(role);
  const quickActions = getQuickActions(role);

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
    securityState,
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
    isSensitiveTwoFactorRole(role)
      ? prisma.user.findUnique({
          where: {
            id: session.user.id,
          },
          select: {
            twoFactorEnabled: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const activeStageDocumentsCount = myActiveStage?.documents.length ?? 0;

  const metrics =
    role === "STAGIAIRE"
      ? [
          {
            label: "Stage actif",
            value: myActiveStage ? getStageStatusLabel(myActiveStage.statut) : "Aucun",
            helper: "Statut actuellement visible pour votre stage",
            accent: <FolderKanban className="h-5 w-5" />,
          },
          {
            label: "Rapports soumis",
            value: String(pendingRapportsCount),
            helper: "Rapports deja transmis et encore en attente de retour",
            accent: <FileClock className="h-5 w-5" />,
          },
          {
            label: "Documents disponibles",
            value: String(activeStageDocumentsCount),
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
              helper: "Notifications non lues a traiter depuis votre espace",
              accent: <ShieldCheck className="h-5 w-5" />,
            },
          ]
        : role === "RH"
          ? [
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
                label: "Documents visibles",
                value: String(documentsCount),
                helper: "Documents non supprimes relies aux stages actuellement visibles",
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
                helper: "Encadrants actifs actuellement mobilises sur les stages suivis",
                accent: <ShieldCheck className="h-5 w-5" />,
              },
            ];

  const priorityItems: PriorityItem[] =
    role === "STAGIAIRE"
      ? [
          {
            title: myActiveStage ? "Stage actif" : "Aucun stage actif",
            description: myActiveStage
              ? `${myActiveStage.departement} · fin prevue le ${formatDate(myActiveStage.dateFin)}`
              : "Aucun stage visible n est actuellement rattache a votre compte.",
            value: myActiveStage ? (
              <StatusBadge status={getStageStatusLabel(myActiveStage.statut)} />
            ) : (
              <span className="text-lg font-semibold text-foreground">Aucun</span>
            ),
            href: "/documents",
            cta: "Voir mes documents",
          },
          {
            title: "Rapports soumis",
            description:
              pendingRapportsCount > 0
                ? `${pendingRapportsCount} rapport${pendingRapportsCount > 1 ? "s" : ""} attend${pendingRapportsCount > 1 ? "ent" : ""} un retour.`
                : "Aucun rapport soumis n attend de retour pour le moment.",
            value: <span className="text-2xl font-semibold tracking-tight">{pendingRapportsCount}</span>,
            href: "/rapports",
            cta: "Ouvrir mes rapports",
          },
          {
            title: "Documents disponibles",
            description:
              activeStageDocumentsCount > 0
                ? `${activeStageDocumentsCount} document${activeStageDocumentsCount > 1 ? "s" : ""} accessible${activeStageDocumentsCount > 1 ? "s" : ""} pour votre stage actif.`
                : "Les documents partages pour votre stage apparaitront ici des qu ils seront disponibles.",
            value: (
              <span className="text-2xl font-semibold tracking-tight">
                {activeStageDocumentsCount}
              </span>
            ),
            href: "/documents",
            cta: "Ouvrir mes documents",
          },
        ]
      : role === "ENCADRANT"
        ? [
            {
              title: "Rapports a relire",
              description:
                pendingRapportsCount > 0
                  ? `${pendingRapportsCount} rapport${pendingRapportsCount > 1 ? "s" : ""} soumis attend${pendingRapportsCount > 1 ? "ent" : ""} votre retour.`
                  : "Aucun rapport soumis n attend votre relecture pour l instant.",
              value: <span className="text-2xl font-semibold tracking-tight">{pendingRapportsCount}</span>,
              href: "/rapports",
              cta: "Traiter les rapports",
            },
            {
              title: "Echeances proches",
              description:
                endingSoonStages.length > 0
                  ? `${endingSoonStages.length} stage${endingSoonStages.length > 1 ? "s" : ""} se termine${endingSoonStages.length > 1 ? "nt" : ""} dans les 15 prochains jours.`
                  : "Aucune fin de stage proche n est visible dans votre perimetre.",
              value: <span className="text-2xl font-semibold tracking-tight">{endingSoonStages.length}</span>,
              href: "/stages",
              cta: "Voir mes stages",
            },
            {
              title: "Notifications non lues",
              description:
                unreadNotificationsCount > 0
                  ? "Des alertes attendent votre attention dans le centre de notifications."
                  : "Aucune notification urgente non lue a traiter.",
              value: (
                <span className="text-2xl font-semibold tracking-tight">{unreadNotificationsCount}</span>
              ),
              href: "/notifications",
              cta: "Ouvrir les notifications",
            },
          ]
        : [
            {
              title: "Rapports a relire",
              description:
                pendingRapportsCount > 0
                  ? `${pendingRapportsCount} rapport${pendingRapportsCount > 1 ? "s" : ""} soumis attend${pendingRapportsCount > 1 ? "ent" : ""} une action.`
                  : "Aucun rapport soumis n attend d action immediate.",
              value: <span className="text-2xl font-semibold tracking-tight">{pendingRapportsCount}</span>,
              href: "/rapports",
              cta: "Voir les rapports",
            },
            {
              title: "Echeances proches",
              description:
                endingSoonStages.length > 0
                  ? `${endingSoonStages.length} stage${endingSoonStages.length > 1 ? "s" : ""} se termine${endingSoonStages.length > 1 ? "nt" : ""} dans les 15 prochains jours.`
                  : "Aucune fin de stage proche n est actuellement visible.",
              value: <span className="text-2xl font-semibold tracking-tight">{endingSoonStages.length}</span>,
              href: "/stages",
              cta: "Voir les stages",
            },
            role === "RH"
              ? {
                  title: "Documents visibles",
                  description:
                    documentsCount > 0
                      ? `${documentsCount} document${documentsCount > 1 ? "s" : ""} non supprime${documentsCount > 1 ? "s" : ""} sont disponibles dans le perimetre actuel.`
                      : "Aucun document visible n est actuellement disponible.",
                  value: <span className="text-2xl font-semibold tracking-tight">{documentsCount}</span>,
                  href: "/documents",
                  cta: "Voir les documents",
                }
              : {
                  title: "Encadrants actifs",
                  description:
                    encadrantsCount > 0
                      ? `${encadrantsCount} encadrant${encadrantsCount > 1 ? "s" : ""} actif${encadrantsCount > 1 ? "s" : ""} contribue${encadrantsCount > 1 ? "nt" : ""} au dispositif.`
                      : "Aucun encadrant actif n a ete trouve dans le perimetre actuel.",
                  value: <span className="text-2xl font-semibold tracking-tight">{encadrantsCount}</span>,
                  href: "/stages",
                  cta: "Voir les stages",
                },
          ];

  const recentRapportsTitle =
    role === "STAGIAIRE"
      ? "Mes derniers rapports"
      : role === "ENCADRANT"
        ? "Derniers rapports de mon perimetre"
        : "Derniers rapports a surveiller";

  const endingSoonTitle =
    role === "STAGIAIRE" ? "Ma fin de stage a venir" : "Stages bientot termines";
  const endingSoonDescription =
    role === "STAGIAIRE"
      ? "Verifiez la prochaine echeance visible pour votre stage actuel."
      : "Reperez rapidement les stages qui demandent une attention rapprochee.";
  const endingSoonActionLabel = role === "STAGIAIRE" ? "Voir mes rapports" : "Voir les stages";
  const endingSoonActionHref = role === "STAGIAIRE" ? "/rapports" : "/stages";

  return (
    <div className="space-y-8">
      <LiveNotificationsListener />
      <PageHeader
        eyebrow={roleIntro.eyebrow}
        title={roleIntro.title}
        description={roleIntro.description}
        actions={
          <>
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className={getQuickActionClassName(action.variant)}>
                {action.label}
              </Link>
            ))}
          </>
        }
      />

      {isSensitiveTwoFactorRole(role) && !securityState?.twoFactorEnabled ? (
        <Card className="border-amber-200/80 bg-linear-to-br from-amber-50/90 to-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-700">Action de securite recommandee</p>
              <h2 className="text-xl font-semibold tracking-tight text-amber-900">
                Activez le 2FA sur votre compte sensible
              </h2>
              <p className="text-sm leading-6 text-amber-800">
                Le module est deja disponible dans votre espace securite pour renforcer la
                protection des profils `ADMIN` et `RH`.
              </p>
            </div>
            <Link
              href="/securite"
              className="inline-flex min-h-11 items-center justify-center rounded-[20px] bg-amber-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_38px_-24px_rgba(180,83,9,0.42)] transition hover:-translate-y-0.5 hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50"
            >
              Ouvrir la securite du compte
            </Link>
          </div>
        </Card>
      ) : null}

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

      <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <Card className="space-y-5">
          <div>
            <p className="text-sm font-medium text-primary">Priorites</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {role === "STAGIAIRE" ? "Ce que je dois suivre" : "Ce qui demande une action"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Les cartes ci-dessous mettent en avant les points les plus utiles pour votre role a
              partir des donnees visibles dans votre perimetre.
            </p>
          </div>

          <div className="space-y-3">
            {priorityItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex flex-col gap-4 rounded-[24px] border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-[0_16px_30px_-24px_rgba(15,118,110,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-2">
                  <p className="text-base font-semibold">{item.title}</p>
                  <p className="text-sm leading-6 text-muted">{item.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                  <div className="text-foreground">{item.value}</div>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    {item.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Rapports recents</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{recentRapportsTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Les rapports les plus recents apparaissent ici pour vous aider a reprendre vite le
                contexte.
              </p>
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
                  className="rounded-[24px] border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-[0_16px_30px_-24px_rgba(15,118,110,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
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
                        {rapport.stage.departement} - {rapport.stage.sujet}
                      </p>
                    </div>
                    <div className="text-sm text-muted sm:text-right">
                      <p className="font-medium text-foreground">{rapport.avancement}%</p>
                      <p>Mis a jour le {formatShortDate(rapport.updatedAt)}</p>
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
      </section>

      <Card className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Echeances</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{endingSoonTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{endingSoonDescription}</p>
          </div>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
            Sous 15 jours
          </span>
        </div>

        {endingSoonStages.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {endingSoonStages.map((stage) => (
              <Link
                key={stage.id}
                href={getEndingSoonStageHref(role, stage.stagiaireId)}
                className="block rounded-[22px] border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-[0_16px_30px_-24px_rgba(15,118,110,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {`${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom}`.trim()}
                    </p>
                    <p className="text-sm text-muted">{stage.departement}</p>
                    <p className="text-sm text-muted">Fin le {formatDate(stage.dateFin)}</p>
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
            actionHref={endingSoonActionHref}
            actionLabel={endingSoonActionLabel}
          />
        )}
      </Card>
    </div>
  );
}
