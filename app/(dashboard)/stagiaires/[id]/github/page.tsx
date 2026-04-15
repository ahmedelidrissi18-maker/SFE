import Link from "next/link";
import { ExternalLink, Github, GitPullRequest, History, MessageSquareDot } from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { githubService, getGithubSyncStatusLabel } from "@/lib/github/service";
import { prisma } from "@/lib/prisma";

type GithubSummaryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type GithubSyncPayloadView = {
  repository?: {
    fullName?: string;
    htmlUrl?: string;
    description?: string | null;
  };
  recentCommits?: Array<{
    sha: string;
    message: string;
    htmlUrl: string;
  }>;
  recentPullRequests?: Array<{
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
  }>;
  recentIssues?: Array<{
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
  }>;
};

function formatDateTime(date?: Date | null) {
  if (!date) {
    return "Non renseignee";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <div className="rounded-[22px] border border-border bg-background p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{helper}</p>
    </div>
  );
}

export default async function GithubSummaryPage({ params }: GithubSummaryPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return null;
  }

  const stagiaire = await prisma.stagiaire.findUnique({
    where: { id },
    include: {
      user: true,
      stages: {
        where: {
          githubRepo: {
            not: null,
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 1,
      },
      githubConnection: {
        include: {
          syncLogs: {
            orderBy: [{ synchronizedAt: "desc" }],
            take: 5,
          },
        },
      },
    },
  });

  if (!stagiaire) {
    notFound();
  }

  const githubSummary = await githubService.getSummary(stagiaire.id);
  const latestPayload =
    githubSummary.latestSync?.payload &&
    typeof githubSummary.latestSync.payload === "object" &&
    githubSummary.latestSync.payload !== null
      ? (githubSummary.latestSync.payload as GithubSyncPayloadView)
      : null;
  const latestStage = stagiaire.stages[0] ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sprint 1"
        title={`Synthese GitHub - ${`${stagiaire.user.prenom} ${stagiaire.user.nom}`.trim()}`}
        description="Vue dediee au suivi technique GitHub du stagiaire : compte lie, depot de reference, activites recentes et historique des synchronisations."
        actions={
          <>
            <Link
              href={`/stagiaires/${stagiaire.id}`}
              className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Retour a la fiche
            </Link>
            <Link
              href={`/api/github/connect?stagiaireId=${stagiaire.id}&returnTo=${encodeURIComponent(
                `/stagiaires/${stagiaire.id}/github`,
              )}`}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Reconnecter via OAuth
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Compte GitHub"
          value={githubSummary.connection?.username ?? "Non lie"}
          helper="Compte confirme et visible sur ce stagiaire"
        />
        <StatCard
          label="Commits"
          value={githubSummary.latestSync?.commitsCount ?? 0}
          helper="Nombre de commits remontes au dernier cycle"
        />
        <StatCard
          label="Pull requests"
          value={githubSummary.latestSync?.pullRequestsCount ?? 0}
          helper="PR recuperees lors de la derniere synchronisation"
        />
        <StatCard
          label="Issues"
          value={githubSummary.latestSync?.issuesCount ?? 0}
          helper="Issues hors PR recuperees sur le depot"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Github className="h-5 w-5" />
                <p className="text-sm font-medium">Connexion GitHub</p>
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Etat de liaison</h2>
            </div>

            <StatusBadge
              status={getGithubSyncStatusLabel(githubSummary.connection?.lastSyncStatus)}
            />
          </div>

          {githubSummary.connection ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {githubSummary.connection.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={githubSummary.connection.avatarUrl}
                    alt={githubSummary.connection.username}
                    className="h-16 w-16 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-accent text-primary">
                    <Github className="h-6 w-6" />
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{githubSummary.connection.username}</p>
                  <Link
                    href={githubSummary.connection.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    Voir le profil GitHub
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Derniere synchronisation</p>
                  <p className="mt-2 text-sm font-medium">
                    {formatDateTime(githubSummary.connection.lastSyncAt)}
                  </p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Depot stage</p>
                  <p className="mt-2 text-sm font-medium">
                    {latestStage?.githubRepo ?? "Non renseigne"}
                  </p>
                </div>
              </div>

              {githubSummary.connection.lastSyncError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {githubSummary.connection.lastSyncError}
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title="Aucun compte GitHub lie"
              description="Demarrez la connexion OAuth GitHub pour associer un compte au stagiaire avant la premiere synchronisation."
            />
          )}
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center gap-2 text-primary">
            <History className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">Historique</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Dernieres synchronisations
              </h2>
            </div>
          </div>

          {stagiaire.githubConnection?.syncLogs.length ? (
            <div className="space-y-3">
              {stagiaire.githubConnection.syncLogs.map((syncLog) => (
                <div
                  key={syncLog.id}
                  className="rounded-[22px] border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <StatusBadge status={getGithubSyncStatusLabel(syncLog.status)} />
                      <p className="text-sm text-muted">
                        {formatDateTime(syncLog.synchronizedAt)}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-muted sm:text-right">
                      <p>{syncLog.commitsCount} commits</p>
                      <p>{syncLog.pullRequestsCount} PR</p>
                      <p>{syncLog.issuesCount} issues</p>
                    </div>
                  </div>
                  {syncLog.errorMessage ? (
                    <p className="mt-3 text-sm text-red-600">{syncLog.errorMessage}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune synchronisation historisee"
              description="Les executions GitHub apparaitront ici apres la premiere synchronisation du stagiaire."
            />
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-5 xl:col-span-1">
          <div className="flex items-center gap-2 text-primary">
            <Github className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">Depot cible</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Referentiel du stage
              </h2>
            </div>
          </div>

          {latestPayload?.repository?.fullName ? (
            <div className="space-y-3">
              <Link
                href={latestPayload.repository.htmlUrl ?? latestStage?.githubRepo ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                {latestPayload.repository.fullName}
                <ExternalLink className="h-4 w-4" />
              </Link>
              <p className="text-sm leading-6 text-muted">
                {latestPayload.repository.description ?? "Aucune description fournie par GitHub."}
              </p>
            </div>
          ) : (
            <EmptyState
              title="Depot non synchronise"
              description="Renseignez l URL GitHub du stage puis lancez une synchronisation pour voir le depot ici."
            />
          )}
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center gap-2 text-primary">
            <Github className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">Commits</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Activite recente</h2>
            </div>
          </div>

          {latestPayload?.recentCommits?.length ? (
            <div className="space-y-3">
              {latestPayload.recentCommits.map((commit) => (
                <Link
                  key={commit.sha}
                  href={commit.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[22px] border border-border bg-background p-4 transition hover:border-primary/40"
                >
                  <p className="text-sm font-medium">{commit.message}</p>
                  <p className="mt-2 text-xs text-muted">{commit.sha.slice(0, 7)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun commit remonte"
              description="Les derniers commits GitHub apparaitront ici apres synchronisation."
            />
          )}
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center gap-2 text-primary">
            <GitPullRequest className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">PR et issues</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Travail ouvert</h2>
            </div>
          </div>

          {latestPayload?.recentPullRequests?.length || latestPayload?.recentIssues?.length ? (
            <div className="space-y-4">
              {latestPayload?.recentPullRequests?.slice(0, 3).map((pullRequest) => (
                <Link
                  key={`pr-${pullRequest.number}`}
                  href={pullRequest.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[22px] border border-border bg-background p-4 transition hover:border-primary/40"
                >
                  <p className="text-sm font-medium">PR #{pullRequest.number}</p>
                  <p className="mt-1 text-sm text-muted">{pullRequest.title}</p>
                </Link>
              ))}

              {latestPayload?.recentIssues?.slice(0, 3).map((issue) => (
                <Link
                  key={`issue-${issue.number}`}
                  href={issue.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[22px] border border-border bg-background p-4 transition hover:border-primary/40"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquareDot className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Issue #{issue.number}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">{issue.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune PR ou issue visible"
              description="Les pull requests et issues recentes remonteront ici apres la prochaine synchronisation."
            />
          )}
        </Card>
      </section>
    </div>
  );
}
