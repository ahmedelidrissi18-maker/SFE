"use client";

import Link from "next/link";
import { GitBranch, Github, RefreshCcw } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { GithubActionState } from "@/app/(dashboard)/stagiaires/github-actions";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type GithubIntegrationCardProps = {
  stagiaireId: string;
  repositoryUrl?: string | null;
  oauthConnectHref: string;
  summaryHref: string;
  connection: {
    username: string;
    profileUrl: string;
    avatarUrl?: string | null;
    lastSyncError?: string | null;
  } | null;
  latestSync: {
    statusLabel: string;
    synchronizedAtLabel: string;
    commitsCount: number;
    pullRequestsCount: number;
    issuesCount: number;
    payload?: {
      repository?: {
        fullName?: string;
        description?: string | null;
      };
      recentCommits?: Array<{
        sha: string;
        message: string;
        htmlUrl: string;
      }>;
    } | null;
  } | null;
  linkAction: (
    state: GithubActionState,
    formData: FormData,
  ) => Promise<GithubActionState>;
  syncAction: (
    state: GithubActionState,
    formData: FormData,
  ) => Promise<GithubActionState>;
};

const initialState: GithubActionState = {};

function SubmitButton({
  label,
  pendingLabel,
  variant = "primary",
}: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        variant === "primary"
          ? "rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          : "rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
      }
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[22px] border border-border bg-background p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

export function GithubIntegrationCard({
  stagiaireId,
  repositoryUrl,
  oauthConnectHref,
  summaryHref,
  connection,
  latestSync,
  linkAction,
  syncAction,
}: GithubIntegrationCardProps) {
  const [linkState, linkFormAction] = useActionState(linkAction, initialState);
  const [syncState, syncFormAction] = useActionState(syncAction, initialState);

  return (
    <Card className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <Github className="h-5 w-5" />
            <p className="text-sm font-medium">Sprint 1 - Integration GitHub</p>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Suivi technique du stagiaire</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            Liez un compte GitHub, utilisez le depot rattache au stage et lancez une
            synchronisation pour recuperer les activites techniques recentes.
          </p>
        </div>

        {latestSync ? <StatusBadge status={latestSync.statusLabel} /> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Compte GitHub" value={connection?.username ?? "Non lie"} />
        <StatCard label="Depot stage" value={repositoryUrl ? "Configure" : "Manquant"} />
        <StatCard
          label="Derniere synchro"
          value={latestSync?.synchronizedAtLabel ?? "Jamais"}
        />
        <StatCard label="Commits recents" value={latestSync?.commitsCount ?? 0} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={oauthConnectHref}
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Connecter via OAuth GitHub
        </Link>
        <Link
          href={summaryHref}
          className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
        >
          Ouvrir la synthese GitHub
        </Link>
      </div>

      {connection ? (
        <div className="rounded-[24px] border border-border bg-background p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted">Profil lie</p>
              <div className="flex items-center gap-3">
                {connection.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={connection.avatarUrl}
                    alt={connection.username}
                    className="h-12 w-12 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent text-primary">
                    <GitBranch className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{connection.username}</p>
                  <Link
                    href={connection.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Voir le profil GitHub
                  </Link>
                </div>
              </div>
              {connection.lastSyncError ? (
                <p className="text-sm text-red-600">{connection.lastSyncError}</p>
              ) : null}
            </div>

            <form action={syncFormAction}>
              <input type="hidden" name="stagiaireId" value={stagiaireId} />
              <SubmitButton
                label="Synchroniser maintenant"
                pendingLabel="Synchronisation..."
                variant="secondary"
              />
            </form>
          </div>
        </div>
      ) : (
        <form
          action={linkFormAction}
          className="grid gap-4 rounded-[24px] border border-border bg-background p-5 lg:grid-cols-[1fr_auto]"
        >
          <input type="hidden" name="stagiaireId" value={stagiaireId} />
          <label className="space-y-2 text-sm">
            <span className="font-medium">Fallback manuel</span>
            <input
              name="username"
              placeholder="exemple: octocat"
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none transition focus:border-primary"
              required
            />
          </label>
          <div className="flex items-end">
            <SubmitButton label="Lier manuellement" pendingLabel="Liaison..." />
          </div>
        </form>
      )}

      {linkState.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {linkState.error}
        </div>
      ) : null}

      {syncState.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {syncState.error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[24px] border border-border bg-background p-5">
          <p className="text-sm text-muted">Depot associe</p>
          {repositoryUrl ? (
            <Link
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <GitBranch className="h-4 w-4" />
              {repositoryUrl}
            </Link>
          ) : (
            <p className="mt-2 text-sm leading-6 text-muted">
              Aucun depot GitHub n est encore renseigne sur le stage. La liaison du compte peut
              etre preparee, mais la synchronisation restera inactive tant qu une URL de depot n a
              pas ete ajoutee.
            </p>
          )}
        </div>

        <div className="rounded-[24px] border border-border bg-background p-5">
          <div className="flex items-center gap-2 text-primary">
            <RefreshCcw className="h-4 w-4" />
            <p className="text-sm font-medium">Dernier resume technique</p>
          </div>

          {latestSync?.payload?.recentCommits?.length ? (
            <div className="mt-4 space-y-3">
              {latestSync.payload.recentCommits.slice(0, 3).map((commit) => (
                <Link
                  key={commit.sha}
                  href={commit.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-border px-4 py-3 transition hover:border-primary/40"
                >
                  <p className="text-sm font-medium">{commit.message}</p>
                  <p className="mt-1 text-xs text-muted">{commit.sha.slice(0, 7)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              Aucune activite GitHub synchronisee pour le moment. Lancez une premiere
              synchronisation apres la liaison du compte.
            </p>
          )}

          {latestSync ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatCard label="PR recentes" value={latestSync.pullRequestsCount} />
              <StatCard label="Issues recentes" value={latestSync.issuesCount} />
              <StatCard
                label="Repos synchronises"
                value={latestSync.payload?.repository?.fullName ? 1 : 0}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
