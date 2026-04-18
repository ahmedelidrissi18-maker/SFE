import Link from "next/link";
import { CheckCircle2, FileClock, MessageSquareQuote, Send } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { reviewRapportAction, saveRapportAction } from "@/app/(dashboard)/rapports/actions";
import { RapportForm } from "@/components/features/rapports/rapport-form";
import { RapportReviewForm } from "@/components/features/rapports/rapport-review-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { canEditRapport, canReviewRapport, getRapportStatusLabel } from "@/lib/rapports";
import { hasRole } from "@/lib/rbac";
import { formatDate } from "@/lib/stagiaires";

type RapportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getRapportNextActionLabel(status: string) {
  switch (status) {
    case "BROUILLON":
      return "Completer le contenu puis soumettre le rapport a votre encadrant.";
    case "SOUMIS":
      return "Attendre la relecture et la decision de validation.";
    case "RETOURNE":
      return "Prendre en compte le commentaire encadrant avant une nouvelle soumission.";
    case "VALIDE":
      return "Aucune action immediate n est attendue sur ce rapport.";
    default:
      return "Consulter le detail du rapport pour confirmer la prochaine etape.";
  }
}

export default async function RapportDetailPage({ params, searchParams }: RapportDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const success = getStringParam(((await searchParams) ?? {}).success)?.trim() ?? "";

  const rapport = await prisma.rapport.findUnique({
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
    },
  });

  if (!rapport) {
    notFound();
  }

  const isStagiaireOwner = rapport.stage.stagiaire.userId === session.user.id;
  const isEncadrantOwner = rapport.stage.encadrantId === session.user.id;
  const isStaffReviewer = hasRole(session.user.role, ["ADMIN", "RH"]);

  if (
    !isStagiaireOwner &&
    !(session.user.role === "ENCADRANT" && isEncadrantOwner) &&
    !isStaffReviewer
  ) {
    redirect("/acces-refuse");
  }

  const canEdit =
    session.user.role === "STAGIAIRE" && isStagiaireOwner && canEditRapport(rapport.statut);
  const canReview =
    hasRole(session.user.role, ["ADMIN", "RH", "ENCADRANT"]) &&
    (isStaffReviewer || isEncadrantOwner) &&
    canReviewRapport(rapport.statut);
  const submittedAtLabel = rapport.dateSoumission ? formatDate(rapport.dateSoumission) : "Non soumis";
  const encadrantLabel = rapport.stage.encadrant
    ? `${rapport.stage.encadrant.prenom} ${rapport.stage.encadrant.nom}`.trim()
    : "Non affecte";
  const nextActionLabel = getRapportNextActionLabel(rapport.statut);

  const timelineItems = [
    {
      label: "Creation du brouillon",
      date: rapport.createdAt,
      icon: FileClock,
      helper: "Premiere version enregistree sur la plateforme",
    },
    ...(rapport.dateSoumission
      ? [
          {
            label: "Soumission",
            date: rapport.dateSoumission,
            icon: Send,
            helper: "Le rapport a ete transmis pour revue",
          },
        ]
      : []),
    ...(rapport.commentaireEncadrant
      ? [
          {
            label: "Commentaire encadrant",
            date: rapport.updatedAt,
            icon: MessageSquareQuote,
            helper: "Un retour a ete depose sur le rapport",
          },
        ]
      : []),
    {
      label: "Statut actuel",
      date: rapport.updatedAt,
      icon: CheckCircle2,
      helper: `Etat courant : ${getRapportStatusLabel(rapport.statut)}`,
    },
  ];

  return (
    <div className="space-y-8">
      {success === "saved" ? (
        <FeedbackBanner
          title="Brouillon enregistre"
          message="Le rapport a ete enregistre en brouillon."
          description="Vous pouvez le completer ou le soumettre des que son contenu est pret."
        />
      ) : null}
      {success === "submitted" ? (
        <FeedbackBanner
          title="Rapport soumis"
          message="Le rapport a ete transmis pour relecture."
          description="Le workflow de validation est maintenant en cours sur cette semaine."
        />
      ) : null}
      {success === "validated" ? (
        <FeedbackBanner
          title="Rapport valide"
          message="Le rapport a ete valide."
          description="Aucune action supplementaire n est attendue sur ce rapport."
        />
      ) : null}
      {success === "returned" ? (
        <FeedbackBanner
          kind="warning"
          title="Rapport retourne"
          message="Le rapport a ete retourne avec commentaire."
          description="Le commentaire encadrant est visible plus bas pour guider la correction."
        />
      ) : null}

      <PageHeader
        eyebrow="Rapport hebdomadaire"
        title={`Semaine ${rapport.semaine}`}
        description={`${rapport.stage.stagiaire.user.prenom} ${rapport.stage.stagiaire.user.nom} · ${rapport.stage.departement} · ${rapport.stage.sujet}`}
        actions={
          <>
            <StatusBadge status={getRapportStatusLabel(rapport.statut)} />
            <Link
              href="/rapports"
              className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Retour aux rapports
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Avancement"
          value={`${rapport.avancement}%`}
          helper="Progression declaree pour cette semaine de stage"
          accent={<CheckCircle2 className="h-5 w-5" />}
        />
        <MetricCard
          label="Statut"
          value={<StatusBadge status={getRapportStatusLabel(rapport.statut)} />}
          helper="Etat actuel du rapport dans le workflow"
          accent={<FileClock className="h-5 w-5" />}
        />
        <MetricCard
          label="Soumis le"
          value={submittedAtLabel}
          helper="Date de transmission au workflow de revue"
          accent={<Send className="h-5 w-5" />}
        />
        <MetricCard
          label="Encadrant"
          value={encadrantLabel}
          helper="Responsable de la relecture sur le stage"
          accent={<MessageSquareQuote className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <Card className="space-y-5">
          <div>
            <p className="text-sm font-medium text-primary">Timeline</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Parcours du rapport</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Retrouvez le contexte de stage, l action attendue et les etapes deja franchies.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Stagiaire</p>
              <p className="mt-2 text-sm font-medium">
                {`${rapport.stage.stagiaire.user.prenom} ${rapport.stage.stagiaire.user.nom}`.trim()}
              </p>
            </div>
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Stage</p>
              <p className="mt-2 text-sm font-medium">{rapport.stage.sujet}</p>
            </div>
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Departement</p>
              <p className="mt-2 text-sm font-medium">{rapport.stage.departement}</p>
            </div>
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Derniere mise a jour</p>
              <p className="mt-2 text-sm font-medium">{formatDate(rapport.updatedAt)}</p>
            </div>
          </div>

          <div className="rounded-[22px] border border-primary/15 bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary">Action attendue</p>
            <p className="mt-2 text-sm leading-6 text-foreground">{nextActionLabel}</p>
          </div>

          <div className="space-y-4">
            {timelineItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <div key={`${item.label}-${index}`} className="flex gap-4">
                  <div className="flex w-10 flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {index < timelineItems.length - 1 ? (
                      <div className="mt-2 min-h-8 w-px flex-1 bg-border" />
                    ) : null}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 text-sm text-muted">{item.helper}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {canEdit ? (
          <RapportForm
            title="Modifier le rapport"
            description="Mettez a jour le contenu puis enregistrez le brouillon ou soumettez-le a votre encadrant."
            action={saveRapportAction}
            stages={[
              {
                id: rapport.stage.id,
                label: `${rapport.stage.departement} · ${rapport.stage.sujet}`,
              },
            ]}
            cancelHref="/rapports"
            lockStage
            defaultValues={{
              rapportId: rapport.id,
              stageId: rapport.stage.id,
              semaine: rapport.semaine,
              tachesRealisees: rapport.tachesRealisees,
              difficultes: rapport.difficultes ?? "",
              planSuivant: rapport.planSuivant ?? "",
              avancement: rapport.avancement,
            }}
          />
        ) : (
          <Card className="space-y-5">
            <div>
              <p className="text-sm font-medium text-primary">Contenu</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Corps du rapport</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Consultez les taches declarees, les difficultes remontees et le plan de travail
                suivant.
              </p>
            </div>

            <div className="grid gap-4">
              <section className="rounded-[22px] border border-border bg-background p-4">
                <p className="text-sm text-muted">Taches realisees</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{rapport.tachesRealisees}</p>
              </section>
              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Difficultes</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                    {rapport.difficultes ?? "Aucune difficulte renseignee."}
                  </p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Plan suivant</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                    {rapport.planSuivant ?? "Aucun plan suivant renseigne."}
                  </p>
                </div>
              </section>
            </div>

            {rapport.commentaireEncadrant ? (
              <div className="rounded-[22px] border border-orange-200 bg-orange-50/60 p-4">
                <p className="text-sm font-medium text-orange-700">Commentaire de l encadrant</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-orange-950/80">
                  {rapport.commentaireEncadrant}
                </p>
              </div>
            ) : (
              <EmptyState
                title="Aucun commentaire encadrant"
                description="Le commentaire apparaitra ici des qu un retour ou une validation sera enregistre."
              />
            )}
          </Card>
        )}
      </section>

      {canReview ? (
        <RapportReviewForm
          rapportId={rapport.id}
          defaultComment={rapport.commentaireEncadrant ?? ""}
          action={reviewRapportAction}
        />
      ) : null}
    </div>
  );
}
