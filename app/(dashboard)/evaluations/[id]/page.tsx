import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getEvaluationFormOptions,
  reviewEvaluationAction,
  saveEvaluationAction,
} from "@/app/(dashboard)/evaluations/actions";
import { EvaluationForm } from "@/components/features/evaluations/evaluation-form";
import { EvaluationReviewForm } from "@/components/features/evaluations/evaluation-review-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  canEditEvaluation,
  canReviewEvaluation,
  canViewEvaluationForStage,
  evaluationGridDefinitions,
  getEvaluationRevisionActionLabel,
  getEvaluationStatusLabel,
  getEvaluationTypeLabel,
  normalizeEvaluationCriteriaSnapshot,
  normalizeEvaluationNotes,
} from "@/lib/evaluations";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/stagiaires";

type EvaluationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateInput(date?: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getEvaluationNextActionLabel(status: string) {
  switch (status) {
    case "BROUILLON":
      return "Completer la grille puis soumettre l evaluation a validation.";
    case "SOUMIS":
      return "Attendre la decision RH sur l evaluation soumise.";
    case "RETOURNE":
      return "Mettre a jour l evaluation en tenant compte du retour RH.";
    case "VALIDE":
      return "Le cycle de validation est termine pour cette evaluation.";
    default:
      return "Consulter l historique pour verifier la prochaine etape.";
  }
}

export default async function EvaluationDetailPage({
  params,
  searchParams,
}: EvaluationDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const success = getStringParam(((await searchParams) ?? {}).success)?.trim() ?? "";

  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
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
      revisions: {
        orderBy: [{ createdAt: "desc" }],
      },
    },
  });

  if (!evaluation) {
    notFound();
  }

  const isAssignedEncadrant = evaluation.stage.encadrantId === session.user.id;
  const isStageOwner = evaluation.stage.stagiaire.userId === session.user.id;

  if (
    !canViewEvaluationForStage(session.user.role, {
      isAssignedEncadrant,
      isStageOwner,
    })
  ) {
    redirect("/acces-refuse");
  }

  const revisionUsers = await prisma.user.findMany({
    where: {
      id: {
        in: [...new Set(evaluation.revisions.map((revision) => revision.changedByUserId))],
      },
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
    },
  });
  const revisionUserById = new Map(
    revisionUsers.map((user) => [user.id, `${user.prenom} ${user.nom}`.trim()]),
  );

  const criteriaSnapshot = normalizeEvaluationCriteriaSnapshot(
    evaluation.criteriaSnapshot,
    evaluation.type,
  );
  const notes = normalizeEvaluationNotes(evaluation.notes, criteriaSnapshot);
  const criteriaWithScores = criteriaSnapshot.map((criterion) => ({
    criterionId: criterion.id,
    label: criterion.label,
    description: criterion.description,
    maxScore: criterion.maxScore,
    score: notes.find((entry) => entry.criterionId === criterion.id)?.score ?? 0,
    comment: notes.find((entry) => entry.criterionId === criterion.id)?.comment ?? "",
  }));
  const { stages } = await getEvaluationFormOptions();
  const canEditCurrentEvaluation =
    session.user.role !== "STAGIAIRE" &&
    canEditEvaluation(evaluation.status) &&
    (session.user.role === "ADMIN" || session.user.role === "RH" || isAssignedEncadrant);
  const canReviewCurrentEvaluation =
    (session.user.role === "ADMIN" || session.user.role === "RH") &&
    canReviewEvaluation(evaluation.status);
  const typeDefinitions = Object.values(evaluationGridDefinitions).map((definition) => ({
    value: definition.type,
    label: definition.label,
    description: definition.description,
    criteria: definition.criteria,
  }));
  const encadrantLabel = evaluation.stage.encadrant
    ? `${evaluation.stage.encadrant.prenom} ${evaluation.stage.encadrant.nom}`.trim()
    : "Non affecte";
  const nextActionLabel = getEvaluationNextActionLabel(evaluation.status);

  return (
    <div className="space-y-8">
      {success === "saved" ? (
        <FeedbackBanner
          title="Evaluation enregistree"
          message="L evaluation a ete enregistree."
          description="Vous pouvez encore l ajuster avant sa soumission a validation."
        />
      ) : null}
      {success === "submitted" ? (
        <FeedbackBanner
          title="Evaluation soumise"
          message="L evaluation a ete soumise a validation."
          description="Elle est maintenant visible dans le circuit de revue RH."
        />
      ) : null}
      {success === "validated" ? (
        <FeedbackBanner
          title="Evaluation validee"
          message="L evaluation a ete validee."
          description="Le resultat final est maintenant stabilise pour ce jalon de stage."
        />
      ) : null}
      {success === "returned" ? (
        <FeedbackBanner
          kind="warning"
          title="Evaluation retournee"
          message="L evaluation a ete retournee avec commentaire RH."
          description="Le commentaire RH est disponible plus bas pour guider la reprise."
        />
      ) : null}

      <PageHeader
        eyebrow="Evaluation"
        title={getEvaluationTypeLabel(evaluation.type)}
        description={`${evaluation.stage.stagiaire.user.prenom} ${evaluation.stage.stagiaire.user.nom} · ${evaluation.stage.departement} · ${evaluation.stage.sujet}`}
        actions={
          <>
            <StatusBadge status={getEvaluationStatusLabel(evaluation.status)} />
            <Link
              href="/evaluations"
              className="rounded-full bg-surface-container-low px-5 py-3 text-sm font-semibold text-on-surface shadow-[var(--shadow-soft)] transition hover:bg-surface-container-high hover:text-primary"
            >
              Retour aux evaluations
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Score"
          value={`${evaluation.totalScore}/${evaluation.maxScore}`}
          helper="Note globale calculee sur la grille active"
          accent={<MaterialSymbol icon="grading" className="text-[20px]" />}
        />
        <MetricCard
          label="Statut"
          value={<StatusBadge status={getEvaluationStatusLabel(evaluation.status)} />}
          helper="Etat actuel dans le workflow de validation"
          accent={<MaterialSymbol icon="task_alt" className="text-[20px]" filled />}
        />
        <MetricCard
          label="Planifiee le"
          value={formatDate(evaluation.scheduledFor)}
          helper="Date cible de realisation de l evaluation"
          accent={<MaterialSymbol icon="history" className="text-[20px]" />}
        />
        <MetricCard
          label="Revisions"
          value={evaluation.revisions.length}
          helper={`${encadrantLabel}, prochaine action : ${nextActionLabel}`}
          accent={<MaterialSymbol icon="chat" className="text-[20px]" />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="space-y-5">
          <div>
            <p className="text-sm font-medium text-primary">Historique</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Revisions et transitions</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Visualisez le contexte de stage et les changements qui ont conduit au statut actuel.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Stagiaire</p>
              <p className="mt-2 text-sm font-medium">
                {`${evaluation.stage.stagiaire.user.prenom} ${evaluation.stage.stagiaire.user.nom}`.trim()}
              </p>
            </div>
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Encadrant</p>
              <p className="mt-2 text-sm font-medium">{encadrantLabel}</p>
            </div>
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Stage</p>
              <p className="mt-2 text-sm font-medium">{evaluation.stage.sujet}</p>
            </div>
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Planifiee le</p>
              <p className="mt-2 text-sm font-medium">{formatDate(evaluation.scheduledFor)}</p>
            </div>
          </div>

          <div className="rounded-[22px] border border-primary/15 bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary">Action attendue</p>
            <p className="mt-2 text-sm leading-6 text-foreground">{nextActionLabel}</p>
          </div>

          {evaluation.revisions.length > 0 ? (
            <div className="space-y-4">
              {evaluation.revisions.map((revision, index) => {
                const actorLabel =
                  revisionUserById.get(revision.changedByUserId) ?? revision.changedByUserId;

                return (
                  <div key={revision.id} className="flex gap-4">
                    <div className="flex w-10 flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {index === 0 ? (
                          <MaterialSymbol icon="grading" className="text-[20px]" />
                        ) : index % 2 === 0 ? (
                          <MaterialSymbol icon="history" className="text-[20px]" />
                        ) : (
                          <MaterialSymbol icon="task_alt" className="text-[20px]" filled />
                        )}
                      </div>
                      {index < evaluation.revisions.length - 1 ? (
                        <div className="mt-2 min-h-8 w-px flex-1 bg-border" />
                      ) : null}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">
                        {getEvaluationRevisionActionLabel(revision.action)} ·{" "}
                        {getEvaluationStatusLabel(revision.nextStatus)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Par {actorLabel} · score {revision.nextScore}/{evaluation.maxScore}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                        {formatDateTime(revision.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Aucune revision disponible"
              description="L historique apparaitra ici a mesure que les transitions et modifications sont enregistrees."
            />
          )}
        </Card>

        {canEditCurrentEvaluation ? (
          <EvaluationForm
            title="Mettre a jour l evaluation"
            description="Ajustez la grille, completez les commentaires puis enregistrez ou soumettez l evaluation."
            action={saveEvaluationAction}
            stages={
              stages.length > 0
                ? stages
                : [
                    {
                      id: evaluation.stage.id,
                      label: `${evaluation.stage.stagiaire.user.prenom} ${evaluation.stage.stagiaire.user.nom} · ${evaluation.stage.departement} · ${evaluation.stage.sujet}`,
                      stagiaireId: evaluation.stage.stagiaireId,
                    },
                  ]
            }
            typeDefinitions={typeDefinitions}
            lockStage
            lockType
            cancelHref="/evaluations"
            defaultValues={{
              evaluationId: evaluation.id,
              stageId: evaluation.stage.id,
              type: evaluation.type,
              scheduledFor: formatDateInput(evaluation.scheduledFor),
              commentaire: evaluation.commentaire ?? "",
              commentaireEncadrant: evaluation.commentaireEncadrant ?? "",
              criteria: criteriaWithScores,
            }}
          />
        ) : (
          <Card className="space-y-5">
            <div>
              <p className="text-sm font-medium text-primary">Grille</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Detail de l evaluation</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Chaque critere affiche son score, son commentaire et la synthese consolidee.
              </p>
            </div>

            <div className="space-y-4">
              {criteriaWithScores.map((criterion) => (
                <div
                  key={criterion.criterionId}
                  className="rounded-[22px] border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{criterion.label}</p>
                      <p className="text-sm leading-6 text-muted">{criterion.description}</p>
                    </div>
                    <div className="text-sm font-semibold">
                      {criterion.score}/{criterion.maxScore}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm leading-6 text-muted">
                    {criterion.comment || "Aucun commentaire sur ce critere."}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-border bg-background p-4">
                <p className="text-sm font-medium text-muted">Synthese generale</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                  {evaluation.commentaire ?? "Aucune synthese generale renseignee."}
                </p>
              </div>
              <div className="rounded-[22px] border border-border bg-background p-4">
                <p className="text-sm font-medium text-muted">Commentaire encadrant</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                  {evaluation.commentaireEncadrant ?? "Aucun commentaire encadrant."}
                </p>
              </div>
            </div>

            <div className="rounded-[22px] border border-border bg-background p-4">
              <div className="flex items-center gap-2">
                <MaterialSymbol icon="chat" className="text-[16px] text-primary" />
                <p className="text-sm font-medium text-muted">Commentaire RH</p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                {evaluation.commentaireRh ?? "Aucun commentaire RH pour le moment."}
              </p>
            </div>
          </Card>
        )}
      </section>

      {canReviewCurrentEvaluation ? (
        <EvaluationReviewForm
          evaluationId={evaluation.id}
          defaultComment={evaluation.commentaireRh ?? ""}
          action={reviewEvaluationAction}
        />
      ) : null}
    </div>
  );
}
