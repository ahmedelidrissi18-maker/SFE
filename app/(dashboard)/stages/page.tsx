import Link from "next/link";
import { CalendarRange, Clock3, FolderKanban, Users } from "lucide-react";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { getStageStatusLabel } from "@/lib/stages";
import { formatDate } from "@/lib/stagiaires";

type StagesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StagesPage({ searchParams }: StagesPageProps) {
  const session = await auth();
  const now = new Date();
  const params = (await searchParams) ?? {};
  const success = getStringParam(params.success)?.trim() ?? "";
  const statut = getStringParam(params.statut)?.trim() ?? "";
  const departement = getStringParam(params.departement)?.trim() ?? "";

  const stages = await prisma.stage.findMany({
    where: {
      ...(departement ? { departement: { contains: departement, mode: "insensitive" } } : {}),
      ...(statut ? { statut: statut as never } : {}),
      ...(session?.user.role === "ENCADRANT" ? { encadrantId: session.user.id } : {}),
    },
    include: {
      stagiaire: {
        include: {
          user: true,
        },
      },
      encadrant: true,
    },
    orderBy: [{ dateDebut: "desc" }],
  });

  const activeCount = stages.filter((stage) =>
    ["PLANIFIE", "EN_COURS", "SUSPENDU"].includes(stage.statut),
  ).length;
  const endingSoonCount = stages.filter((stage) => {
    const diff = stage.dateFin.getTime() - now.getTime();
    return diff >= 0 && diff <= 15 * 24 * 60 * 60 * 1000;
  }).length;
  const hasActiveFilters = Boolean(statut || departement);

  return (
    <div className="space-y-8">
      {success === "created" ? (
        <FeedbackBanner
          title="Stage cree"
          message="Le stage a ete cree avec succes."
          description="Le dossier est maintenant disponible pour les rapports, les evaluations et les documents."
        />
      ) : null}
      {success === "updated" ? (
        <FeedbackBanner
          title="Stage mis a jour"
          message="Le stage a ete modifie avec succes."
          description="Les nouvelles informations sont prises en compte dans les vues de suivi et les echeances."
        />
      ) : null}

      <PageHeader
        eyebrow="Suivi des stages"
        title="Liste des stages"
        description="Visualisez rapidement le perimetre des stages, leur statut, leur encadrant et leur echeance sans perdre le lien avec la fiche stagiaire."
        actions={
          session?.user.role !== "ENCADRANT" ? (
            <Link
              href="/stagiaires"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Creer un stage
            </Link>
          ) : null
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Stages visibles"
          value={stages.length}
          helper="Nombre de stages affiches selon vos filtres et votre role"
          accent={<FolderKanban className="h-5 w-5" />}
        />
        <MetricCard
          label="Actifs"
          value={activeCount}
          helper="Stages planifies, en cours ou temporairement suspendus"
          accent={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Fin proche"
          value={endingSoonCount}
          helper="Stages se terminant dans les quinze prochains jours"
          accent={<CalendarRange className="h-5 w-5" />}
        />
        <MetricCard
          label="Stagiaires couverts"
          value={new Set(stages.map((stage) => stage.stagiaireId)).size}
          helper="Nombre de stagiaires concernes par les stages affiches"
          accent={<Users className="h-5 w-5" />}
        />
      </section>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Filtres</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Cibler un perimetre</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Filtrez par statut ou departement pour retrouver rapidement les stages a suivre.
          </p>
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
              <option value="PLANIFIE">Planifie</option>
              <option value="EN_COURS">En cours</option>
              <option value="SUSPENDU">Suspendu</option>
              <option value="TERMINE">Termine</option>
              <option value="ANNULE">Annule</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Departement</span>
            <input
              name="departement"
              defaultValue={departement}
              placeholder="Infrastructure, Cloud..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>

          <div className="flex flex-wrap items-end gap-3">
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Appliquer les filtres
            </button>
            <Link
              href="/stages"
              className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Revenir a la liste complete
            </Link>
          </div>
        </form>
      </Card>

      {stages.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {stages.map((stage) => (
            <Card key={stage.id} className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={getStageStatusLabel(stage.statut)} />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">{stage.sujet}</h2>
                  <p className="text-sm leading-6 text-muted">{stage.departement}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/stagiaires/${stage.stagiaireId}`}
                    className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Voir stagiaire
                  </Link>
                  {session?.user.role !== "ENCADRANT" ? (
                    <Link
                      href={`/stages/${stage.id}/modifier`}
                      className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:border-primary hover:text-primary"
                    >
                      Modifier
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Stagiaire</p>
                  <p className="mt-2 text-sm font-medium">
                    {`${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom}`.trim()}
                  </p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Encadrant</p>
                  <p className="mt-2 text-sm font-medium">
                    {stage.encadrant
                      ? `${stage.encadrant.prenom} ${stage.encadrant.nom}`.trim()
                      : "Non affecte"}
                  </p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Debut</p>
                  <p className="mt-2 text-sm font-medium">{formatDate(stage.dateDebut)}</p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Fin</p>
                  <p className="mt-2 text-sm font-medium">{formatDate(stage.dateFin)}</p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4 sm:col-span-2 xl:col-span-2">
                  <p className="text-sm text-muted">Depot GitHub</p>
                  <p className="mt-2 truncate text-sm font-medium">
                    {stage.githubRepo ?? "Non renseigne"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="Stages"
          title={hasActiveFilters ? "Aucun stage ne correspond a ces filtres" : "Aucun stage a afficher"}
          description={
            hasActiveFilters
              ? "Essayez un autre statut ou revenez a la liste complete pour retrouver des stages visibles."
              : session?.user.role !== "ENCADRANT"
                ? "Creez un premier stage depuis une fiche stagiaire pour lancer le suivi."
                : "Aucun stage n est actuellement visible dans votre perimetre d encadrement."
          }
          actionHref={
            hasActiveFilters
              ? "/stages"
              : session?.user.role !== "ENCADRANT"
                ? "/stagiaires"
                : "/dashboard"
          }
          actionLabel={
            hasActiveFilters
              ? "Voir tous les stages"
              : session?.user.role !== "ENCADRANT"
                ? "Creer un stage"
                : "Retour au dashboard"
          }
        />
      )}
    </div>
  );
}
