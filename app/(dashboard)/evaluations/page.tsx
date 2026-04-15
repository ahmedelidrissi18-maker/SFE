import Link from "next/link";
import { ClipboardCheck, Clock3, RotateCcw, Trophy } from "lucide-react";
import { EvaluationStatus, EvaluationType } from "@prisma/client";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getEvaluationStatusLabel,
  getEvaluationTypeLabel,
  getEvaluationVisibilityFilter,
} from "@/lib/evaluations";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/stagiaires";

type EvaluationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EvaluationsPage({ searchParams }: EvaluationsPageProps) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const params = (await searchParams) ?? {};
  const statut = getStringParam(params.statut)?.trim() ?? "";
  const type = getStringParam(params.type)?.trim() ?? "";
  const highlight = getStringParam(params.highlight)?.trim() ?? "";
  const now = new Date();
  const soonDate = new Date(now);
  soonDate.setDate(soonDate.getDate() + 15);

  const evaluations = await prisma.evaluation.findMany({
    where: {
      ...getEvaluationVisibilityFilter(session.user.role, session.user.id),
      ...(statut ? { status: statut as EvaluationStatus } : {}),
      ...(type ? { type: type as EvaluationType } : {}),
    },
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
    orderBy: [{ scheduledFor: "asc" }, { updatedAt: "desc" }],
  });

  const submittedCount = evaluations.filter(
    (evaluation) => evaluation.status === EvaluationStatus.SOUMIS,
  ).length;
  const returnedCount = evaluations.filter(
    (evaluation) => evaluation.status === EvaluationStatus.RETOURNE,
  ).length;
  const validatedCount = evaluations.filter(
    (evaluation) => evaluation.status === EvaluationStatus.VALIDE,
  ).length;
  const upcomingCount = evaluations.filter((evaluation) => {
    if (!evaluation.scheduledFor) {
      return false;
    }

    return evaluation.scheduledFor >= now && evaluation.scheduledFor <= soonDate;
  }).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Evaluations"
        title="Workflow des evaluations"
        description="Retrouvez les evaluations de debut, mi-parcours et fin de stage, avec leur statut, leur score et la prochaine action attendue."
        actions={
          session.user.role !== "STAGIAIRE" ? (
            <Link
              href="/evaluations/nouvelle"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Planifier une evaluation
            </Link>
          ) : null
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Evaluations visibles"
          value={evaluations.length}
          helper="Toutes les evaluations accessibles selon votre role"
          accent={<ClipboardCheck className="h-5 w-5" />}
        />
        <MetricCard
          label="A valider"
          value={submittedCount}
          helper="Evaluations soumises et en attente de validation RH"
          accent={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Retournees"
          value={returnedCount}
          helper="Evaluations renvoyees pour correction ou ajustement"
          accent={<RotateCcw className="h-5 w-5" />}
        />
        <MetricCard
          label="Validees"
          value={validatedCount}
          helper={`${upcomingCount} evaluation${upcomingCount > 1 ? "s" : ""} planifiee${upcomingCount > 1 ? "s" : ""} sous 15 jours`}
          accent={<Trophy className="h-5 w-5" />}
        />
      </section>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Filtres</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Cibler le bon lot</h2>
        </div>
        <form className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Statut</span>
            <select
              name="statut"
              defaultValue={statut}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            >
              <option value="">Tous</option>
              <option value={EvaluationStatus.BROUILLON}>Brouillon</option>
              <option value={EvaluationStatus.SOUMIS}>Soumis</option>
              <option value={EvaluationStatus.VALIDE}>Valide</option>
              <option value={EvaluationStatus.RETOURNE}>Retourne</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Type</span>
            <select
              name="type"
              defaultValue={type}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            >
              <option value="">Tous</option>
              <option value={EvaluationType.DEBUT_STAGE}>Debut de stage</option>
              <option value={EvaluationType.MI_PARCOURS}>Mi-parcours</option>
              <option value={EvaluationType.FINAL}>Fin de stage</option>
            </select>
          </label>

          <div className="flex flex-wrap items-end gap-3">
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Appliquer
            </button>
            <Link
              href="/evaluations"
              className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Reinitialiser
            </Link>
          </div>
        </form>
      </Card>

      {evaluations.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {evaluations.map((evaluation) => (
            <Card
              key={evaluation.id}
              className={
                highlight === evaluation.id
                  ? "space-y-5 border-primary/50 shadow-[0_18px_35px_-28px_rgba(15,118,110,0.55)]"
                  : "space-y-5"
              }
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={getEvaluationStatusLabel(evaluation.status)} />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {getEvaluationTypeLabel(evaluation.type)}
                  </h2>
                  <p className="text-sm leading-6 text-muted">
                    {`${evaluation.stage.stagiaire.user.prenom} ${evaluation.stage.stagiaire.user.nom}`.trim()} ·{" "}
                    {evaluation.stage.departement}
                  </p>
                </div>

                <Link
                  href={`/evaluations/${evaluation.id}`}
                  className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Ouvrir
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Score</p>
                  <p className="mt-2 text-sm font-medium">
                    {evaluation.totalScore}/{evaluation.maxScore}
                  </p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Planifiee le</p>
                  <p className="mt-2 text-sm font-medium">{formatDate(evaluation.scheduledFor)}</p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Encadrant</p>
                  <p className="mt-2 text-sm font-medium">
                    {evaluation.stage.encadrant
                      ? `${evaluation.stage.encadrant.prenom} ${evaluation.stage.encadrant.nom}`.trim()
                      : "Non affecte"}
                  </p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4 sm:col-span-2 xl:col-span-3">
                  <p className="text-sm text-muted">Sujet</p>
                  <p className="mt-2 text-sm font-medium">{evaluation.stage.sujet}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucune evaluation a afficher"
          description="Aucune evaluation ne correspond aux filtres actuels. Revenez a la vue complete ou planifiez une nouvelle evaluation."
          actionHref={session.user.role === "STAGIAIRE" ? "/dashboard" : "/evaluations/nouvelle"}
          actionLabel={session.user.role === "STAGIAIRE" ? "Retour au dashboard" : "Creer une evaluation"}
        />
      )}
    </div>
  );
}
