import Link from "next/link";
import { EvaluationStatus, EvaluationType } from "@prisma/client";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MetricCard } from "@/components/ui/metric-card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getEvaluationStatusLabel,
  getEvaluationTypeLabel,
  getEvaluationVisibilityFilter,
  resolveEvaluationStatus,
  resolveEvaluationType,
} from "@/lib/evaluations";
import { getPaginationMeta, parsePageParam } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/stagiaires";

type EvaluationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getEvaluationNextActionLabel(status: EvaluationStatus) {
  switch (status) {
    case EvaluationStatus.BROUILLON:
      return "Completer puis soumettre l evaluation.";
    case EvaluationStatus.SOUMIS:
      return "Validation RH en attente.";
    case EvaluationStatus.RETOURNE:
      return "Correction attendue avant nouvelle soumission.";
    case EvaluationStatus.VALIDE:
      return "Evaluation cloturee, aucune action immediate.";
    default:
      return "Verifier le detail de l evaluation.";
  }
}

export default async function EvaluationsPage({ searchParams }: EvaluationsPageProps) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const params = (await searchParams) ?? {};
  const rawStatut = getStringParam(params.statut)?.trim() ?? "";
  const rawType = getStringParam(params.type)?.trim() ?? "";
  const statut = resolveEvaluationStatus(rawStatut);
  const type = resolveEvaluationType(rawType);
  const highlight = getStringParam(params.highlight)?.trim() ?? "";
  const requestedPage = parsePageParam(params.page);
  const pageSize = 10;
  const now = new Date();
  const soonDate = new Date(now);
  soonDate.setDate(soonDate.getDate() + 15);

  const evaluationWhere = {
    ...getEvaluationVisibilityFilter(session.user.role, session.user.id),
    ...(statut ? { status: statut } : {}),
    ...(type ? { type } : {}),
  };

  const [
    totalEvaluationsCount,
    submittedCount,
    returnedCount,
    validatedCount,
    upcomingCount,
  ] = await Promise.all([
    prisma.evaluation.count({
      where: evaluationWhere,
    }),
    prisma.evaluation.count({
      where: {
        ...evaluationWhere,
        status: EvaluationStatus.SOUMIS,
      },
    }),
    prisma.evaluation.count({
      where: {
        ...evaluationWhere,
        status: EvaluationStatus.RETOURNE,
      },
    }),
    prisma.evaluation.count({
      where: {
        ...evaluationWhere,
        status: EvaluationStatus.VALIDE,
      },
    }),
    prisma.evaluation.count({
      where: {
        ...evaluationWhere,
        scheduledFor: {
          gte: now,
          lte: soonDate,
        },
      },
    }),
  ]);

  const pagination = getPaginationMeta({
    requestedPage,
    totalItems: totalEvaluationsCount,
    pageSize,
  });

  const evaluations = await prisma.evaluation.findMany({
    where: evaluationWhere,
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
    skip: pagination.skip,
    take: pagination.take,
  });

  const hasActiveFilters = Boolean(rawStatut || rawType);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Evaluations"
        title="Workflow des evaluations"
        description="Retrouvez les evaluations de debut, mi-parcours et fin de stage, avec leur statut, leur score et la prochaine action attendue."
        titleClassName="border-l-4 border-indigo-500 pl-4"
        descriptionClassName="text-sm text-muted-foreground max-w-2xl"
        actions={
          session.user.role !== "STAGIAIRE" ? (
            <Link
              href="/evaluations/nouvelle"
              className="action-button action-button-primary px-5 py-3 text-sm"
            >
              Planifier une evaluation
            </Link>
          ) : null
        }
      />

      <section className="grid gap-4 min-[390px]:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Evaluations visibles"
          value={totalEvaluationsCount}
          helper="Toutes les evaluations accessibles selon votre role"
          accent={<MaterialSymbol icon="grading" className="text-[20px]" />}
          borderLeftClass="border-l-4 border-slate-400 bg-slate-50 dark:bg-slate-900/20"
        />
        <MetricCard
          label="A valider"
          value={submittedCount}
          helper="Evaluations soumises et en attente de validation RH"
          accent={<MaterialSymbol icon="schedule" className="text-[20px]" />}
          borderLeftClass="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20"
        />
        <MetricCard
          label="Retournees"
          value={returnedCount}
          helper="Evaluations renvoyees pour correction ou ajustement"
          accent={<MaterialSymbol icon="replay" className="text-[20px]" />}
          borderLeftClass="border-l-4 border-red-400 bg-red-50 dark:bg-red-950/20"
        />
        <MetricCard
          label="Validees"
          value={validatedCount}
          helper={`${upcomingCount} evaluation${upcomingCount > 1 ? "s" : ""} planifiee${upcomingCount > 1 ? "s" : ""} sous 15 jours`}
          accent={<MaterialSymbol icon="military_tech" className="text-[20px]" />}
          borderLeftClass="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20"
        />
      </section>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Filtres</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-2xl border-l-4 border-primary pl-3">Cibler le bon lot</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-prose">
            Filtrez par statut ou type pour retrouver plus vite les evaluations a traiter.
          </p>
        </div>
        <form className="grid gap-4 md:grid-cols-3 rounded-xl border border-border p-6 bg-card">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Statut</span>
            <select
              name="statut"
              defaultValue={statut ?? ""}
              className="w-full rounded-lg bg-muted/30 border border-transparent px-4 py-3 text-sm outline-none transition focus:bg-background focus:border-border focus:ring-2 focus:ring-primary/20"
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
              defaultValue={type ?? ""}
              className="w-full rounded-lg bg-muted/30 border border-transparent px-4 py-3 text-sm outline-none transition focus:bg-background focus:border-border focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tous</option>
              <option value={EvaluationType.DEBUT_STAGE}>Debut de stage</option>
              <option value={EvaluationType.MI_PARCOURS}>Mi-parcours</option>
              <option value={EvaluationType.FINAL}>Fin de stage</option>
            </select>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <button
              type="submit"
              className="w-full px-6 py-2.5 text-sm sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50"
            >
              Appliquer les filtres
            </button>
            <Link
              href="/evaluations"
              className="action-button action-button-secondary w-full px-5 py-3 text-sm sm:w-auto"
            >
              Revenir a la liste complete
            </Link>
          </div>
        </form>
      </Card>

      {evaluations.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {evaluations.map((evaluation) => (
              <Card
                key={evaluation.id}
                className={
                  highlight === evaluation.id
                    ? "space-y-5 bg-linear-to-br from-card via-card to-accent/35 shadow-[0px_18px_35px_rgba(26,28,29,0.08)]"
                    : "space-y-5"
                }
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={getEvaluationStatusLabel(evaluation.status)} />
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                      {getEvaluationTypeLabel(evaluation.type)}
                    </h2>
                    <p className="text-sm leading-6 text-muted">
                      {`${evaluation.stage.stagiaire.user.prenom} ${evaluation.stage.stagiaire.user.nom}`.trim()} -{" "}
                      {evaluation.stage.departement}
                    </p>
                  </div>

                  <Link
                    href={`/evaluations/${evaluation.id}`}
                    className="action-button action-button-primary px-4 py-2.5 text-sm"
                  >
                    Ouvrir
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="tonal-card rounded-[22px] p-4">
                    <p className="text-sm text-muted">Score</p>
                    <p className="mt-2 text-sm font-medium">
                      {evaluation.totalScore}/{evaluation.maxScore}
                    </p>
                  </div>
                  <div className="tonal-card rounded-[22px] p-4">
                    <p className="text-sm text-muted">Planifiee le</p>
                    <p className="mt-2 text-sm font-medium">{formatDate(evaluation.scheduledFor)}</p>
                  </div>
                  <div className="tonal-card rounded-[22px] p-4">
                    <p className="text-sm text-muted">Encadrant</p>
                    <p className="mt-2 text-sm font-medium">
                      {evaluation.stage.encadrant
                        ? `${evaluation.stage.encadrant.prenom} ${evaluation.stage.encadrant.nom}`.trim()
                        : "Non affecte"}
                    </p>
                  </div>
                  <div className="tonal-card rounded-[22px] p-4 sm:col-span-2 xl:col-span-3">
                    <p className="text-sm text-muted">Sujet</p>
                    <p className="mt-2 text-sm font-medium">{evaluation.stage.sujet}</p>
                  </div>
                  <div className="tonal-card rounded-[22px] p-4 sm:col-span-2 xl:col-span-3">
                    <p className="text-sm text-muted">Action attendue</p>
                    <p className="mt-2 text-sm font-medium">
                      {getEvaluationNextActionLabel(evaluation.status)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <PaginationControls
            pathname="/evaluations"
            searchParams={params}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
            itemLabel="evaluations"
          />
        </div>
      ) : (
        <EmptyState
          eyebrow="Evaluations"
          title={hasActiveFilters ? "Aucune evaluation ne correspond a ces filtres" : "Aucune evaluation a afficher"}
          description={
            hasActiveFilters
              ? "Revenez a la vue complete ou ajustez les criteres pour retrouver des evaluations visibles."
              : session.user.role === "STAGIAIRE"
                ? "Aucune evaluation n est actuellement visible dans votre perimetre."
                : "Planifiez une evaluation pour lancer le workflow de notation et de validation."
          }
          actionHref={hasActiveFilters ? "/evaluations" : session.user.role === "STAGIAIRE" ? "/dashboard" : "/evaluations/nouvelle"}
          actionLabel={hasActiveFilters ? "Voir toutes les evaluations" : session.user.role === "STAGIAIRE" ? "Retour au dashboard" : "Creer une evaluation"}
          secondaryActionHref={hasActiveFilters && session.user.role !== "STAGIAIRE" ? "/evaluations/nouvelle" : undefined}
          secondaryActionLabel={hasActiveFilters && session.user.role !== "STAGIAIRE" ? "Planifier une evaluation" : undefined}
        />
      )}
    </div>
  );
}
