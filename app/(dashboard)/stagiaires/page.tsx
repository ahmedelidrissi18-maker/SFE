import Link from "next/link";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toggleStagiaireArchiveAction } from "@/app/(dashboard)/stagiaires/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { formatDate, getAccountStatusLabel, getLatestStageInfo } from "@/lib/stagiaires";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

type StagiairesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StagiairesPage({ searchParams }: StagiairesPageProps) {
  const params = (await searchParams) ?? {};
  const query = getStringParam(params.q)?.trim() ?? "";
  const etablissement = getStringParam(params.etablissement)?.trim() ?? "";
  const departement = getStringParam(params.departement)?.trim() ?? "";
  const statut = getStringParam(params.statut)?.trim() ?? "";
  const encadrantId = getStringParam(params.encadrantId)?.trim() ?? "";
  const success = getStringParam(params.success)?.trim() ?? "";

  const encadrants = await prisma.user.findMany({
    where: {
      role: Role.ENCADRANT,
      isActive: true,
    },
    orderBy: [{ prenom: "asc" }, { nom: "asc" }],
    select: {
      id: true,
      nom: true,
      prenom: true,
    },
  });

  const stagiaires = await prisma.stagiaire.findMany({
    where: {
      user: {
        role: Role.STAGIAIRE,
        ...(query
          ? {
              OR: [
                { nom: { contains: query, mode: "insensitive" } },
                { prenom: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(statut === "actif" ? { isActive: true } : {}),
        ...(statut === "archive" ? { isActive: false } : {}),
      },
      ...(etablissement ? { etablissement: { contains: etablissement, mode: "insensitive" } } : {}),
      ...(departement || encadrantId
        ? {
            stages: {
              some: {
                ...(departement
                  ? { departement: { contains: departement, mode: "insensitive" } }
                  : {}),
                ...(encadrantId ? { encadrantId } : {}),
              },
            },
          }
        : {}),
    },
    orderBy: [{ user: { prenom: "asc" } }, { user: { nom: "asc" } }],
    include: {
      user: true,
      stages: {
        orderBy: [{ createdAt: "desc" }],
        take: 1,
        include: {
          encadrant: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
      },
    },
  });

  const activeCount = stagiaires.filter((stagiaire) => stagiaire.user.isActive).length;
  const archivedCount = stagiaires.length - activeCount;
  const withAssignedStageCount = stagiaires.filter((stagiaire) => stagiaire.stages[0]).length;
  const hasActiveFilters = Boolean(query || etablissement || departement || statut || encadrantId);

  return (
    <div className="space-y-8">
      {success === "created" ? (
        <FeedbackBanner
          title="Stagiaire cree"
          message="Le stagiaire a ete cree avec succes."
          description="Vous pouvez maintenant lui rattacher un stage, ajouter des documents ou ouvrir sa fiche detaillee."
        />
      ) : null}
      {success === "archived" ? (
        <FeedbackBanner
          title="Compte archive"
          message="Le stagiaire a ete archive avec succes."
          description="Le compte reste visible dans l historique mais n est plus actif pour la connexion."
        />
      ) : null}
      {success === "restored" ? (
        <FeedbackBanner
          title="Compte reactive"
          message="Le stagiaire a ete reactive avec succes."
          description="Le stagiaire peut de nouveau acceder a la plateforme si ses autres droits sont en place."
        />
      ) : null}

      <PageHeader
        eyebrow="Module metier"
        title="Liste des stagiaires"
        description="Recherchez rapidement un stagiaire, visualisez son statut de compte, son dernier stage et accedez directement a sa fiche detaillee."
        actions={
          <Link
            href="/stagiaires/nouveau"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-[var(--shadow-soft)] transition hover:opacity-90"
          >
            Nouveau stagiaire
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Stagiaires filtres"
          value={stagiaires.length}
          helper="Resultats correspondant aux criteres actuels"
          accent={<MaterialSymbol icon="groups" className="text-[20px]" filled />}
        />
        <MetricCard
          label="Comptes actifs"
          value={activeCount}
          helper="Stagiaires pouvant se connecter a la plateforme"
          accent={<MaterialSymbol icon="person_search" className="text-[20px]" />}
        />
        <MetricCard
          label="Avec stage"
          value={withAssignedStageCount}
          helper="Stagiaires possedant au moins un stage rattache"
          accent={<MaterialSymbol icon="apartment" className="text-[20px]" />}
        />
        <MetricCard
          label="Archives"
          value={archivedCount}
          helper="Comptes preserves pour l historique et le suivi"
          accent={<MaterialSymbol icon="school" className="text-[20px]" />}
        />
      </section>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Filtres</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Affiner la liste</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Combinez les criteres ci-dessous pour retrouver rapidement un stagiaire ou revenir a un perimetre plus large.
          </p>
        </div>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Recherche</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Nom, prenom ou email"
              className="field-shell w-full rounded-2xl px-4 py-3 outline-none transition"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Etablissement</span>
            <input
              name="etablissement"
              defaultValue={etablissement}
              placeholder="ENSA, EMI, FST..."
              className="field-shell w-full rounded-2xl px-4 py-3 outline-none transition"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Departement</span>
            <input
              name="departement"
              defaultValue={departement}
              placeholder="Transformation digitale..."
              className="field-shell w-full rounded-2xl px-4 py-3 outline-none transition"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Statut du compte</span>
            <select
              name="statut"
              defaultValue={statut}
              className="field-shell w-full rounded-2xl px-4 py-3 outline-none transition"
            >
              <option value="">Tous</option>
              <option value="actif">Actif</option>
              <option value="archive">Archive</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Encadrant</span>
            <select
              name="encadrantId"
              defaultValue={encadrantId}
              className="field-shell w-full rounded-2xl px-4 py-3 outline-none transition"
            >
              <option value="">Tous</option>
              {encadrants.map((encadrant) => (
                <option key={encadrant.id} value={encadrant.id}>
                  {`${encadrant.prenom} ${encadrant.nom}`.trim()}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-5">
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-[var(--shadow-soft)] transition hover:opacity-90"
            >
              Appliquer les filtres
            </button>
            <Link
              href="/stagiaires"
              className="rounded-full bg-surface-container-low px-5 py-3 text-sm font-semibold text-on-surface shadow-[var(--shadow-soft)] transition hover:bg-surface-container-high hover:text-primary"
            >
              Revenir a la liste complete
            </Link>
          </div>
        </form>
      </Card>

      {stagiaires.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {stagiaires.map((stagiaire) => {
            const latestStage = stagiaire.stages[0] ?? null;
            const latestStageInfo = getLatestStageInfo(latestStage);

            return (
              <Card key={stagiaire.id} className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={getAccountStatusLabel(stagiaire.user.isActive)} />
                      <StatusBadge status={latestStageInfo.statut} />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {`${stagiaire.user.prenom} ${stagiaire.user.nom}`.trim()}
                    </h2>
                    <p className="text-sm font-medium text-foreground">
                      {stagiaire.specialite ?? "Specialite non renseignee"}
                    </p>
                    <p className="text-sm leading-6 text-muted">{stagiaire.user.email}</p>
                    <p className="text-sm leading-6 text-muted">
                      {latestStage?.sujet ?? "Aucun stage rattache pour le moment."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/stagiaires/${stagiaire.id}`}
                      className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[var(--shadow-soft)] transition hover:opacity-90"
                    >
                      Voir la fiche
                    </Link>
                    <form action={toggleStagiaireArchiveAction}>
                      <input type="hidden" name="stagiaireId" value={stagiaire.id} />
                      <input type="hidden" name="userId" value={stagiaire.user.id} />
                      <input
                        type="hidden"
                        name="nextActiveValue"
                        value={String(!stagiaire.user.isActive)}
                      />
                      <input type="hidden" name="returnTo" value="/stagiaires" />
                      <button
                        type="submit"
                        className="rounded-full bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-on-surface shadow-[var(--shadow-soft)] transition hover:bg-surface-container-high hover:text-primary"
                      >
                        {stagiaire.user.isActive ? "Archiver" : "Reactiver"}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-[22px] border border-border bg-background p-4">
                    <p className="text-sm text-muted">Etablissement</p>
                    <p className="mt-2 text-sm font-medium">{stagiaire.etablissement ?? "Non renseigne"}</p>
                  </div>
                  <div className="rounded-[22px] border border-border bg-background p-4">
                    <p className="text-sm text-muted">Sujet du stage</p>
                    <p className="mt-2 text-sm font-medium">{latestStage?.sujet ?? "Aucun stage rattache"}</p>
                  </div>
                  <div className="rounded-[22px] border border-border bg-background p-4">
                    <p className="text-sm text-muted">Departement</p>
                    <p className="mt-2 text-sm font-medium">{latestStageInfo.departement}</p>
                  </div>
                  <div className="rounded-[22px] border border-border bg-background p-4">
                    <p className="text-sm text-muted">Encadrant</p>
                    <p className="mt-2 text-sm font-medium">{latestStageInfo.encadrant}</p>
                  </div>
                  <div className="rounded-[22px] border border-border bg-background p-4">
                    <p className="text-sm text-muted">Telephone</p>
                    <p className="mt-2 text-sm font-medium">{stagiaire.telephone ?? "Non renseigne"}</p>
                  </div>
                  <div className="rounded-[22px] border border-border bg-background p-4">
                    <p className="text-sm text-muted">Specialite</p>
                    <p className="mt-2 text-sm font-medium">{stagiaire.specialite ?? "Non renseignee"}</p>
                  </div>
                  <div className="rounded-[22px] border border-border bg-background p-4">
                    <p className="text-sm text-muted">Derniere maj</p>
                    <p className="mt-2 text-sm font-medium">{formatDate(stagiaire.updatedAt)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          eyebrow="Stagiaires"
          title={hasActiveFilters ? "Aucun stagiaire ne correspond a ces filtres" : "Aucun stagiaire disponible"}
          description={
            hasActiveFilters
              ? "Elargissez les filtres ou revenez a la liste complete pour reprendre un perimetre plus large."
              : "Commencez par creer une fiche stagiaire afin d alimenter le suivi, les stages et les workflows associes."
          }
          actionHref={hasActiveFilters ? "/stagiaires" : "/stagiaires/nouveau"}
          actionLabel={hasActiveFilters ? "Voir tous les stagiaires" : "Creer un stagiaire"}
          secondaryActionHref={hasActiveFilters ? "/stagiaires/nouveau" : undefined}
          secondaryActionLabel={hasActiveFilters ? "Creer un stagiaire" : undefined}
        />
      )}
    </div>
  );
}
