import Link from "next/link";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toggleStagiaireArchiveAction } from "@/app/(dashboard)/stagiaires/actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { getAccountStatusLabel, getLatestStageInfo } from "@/lib/stagiaires";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      {success === "created" ? (
        <FeedbackBanner message="Le stagiaire a ete cree avec succes." />
      ) : null}
      {success === "archived" ? (
        <FeedbackBanner message="Le stagiaire a ete archive avec succes." />
      ) : null}
      {success === "restored" ? (
        <FeedbackBanner message="Le stagiaire a ete reactive avec succes." />
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">Module metier</p>
          <h1 className="text-3xl font-semibold tracking-tight">Liste des stagiaires</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            Vue reliee a Prisma avec recherche, filtres et acces au detail de chaque stagiaire.
          </p>
        </div>

        <Link
          href="/stagiaires/nouveau"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Nouveau stagiaire
        </Link>
      </div>

      <Card>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Recherche</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Nom, prenom ou email"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Etablissement</span>
            <input
              name="etablissement"
              defaultValue={etablissement}
              placeholder="ENSA, FST..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Departement</span>
            <input
              name="departement"
              defaultValue={departement}
              placeholder="Informatique..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Statut</span>
            <select
              name="statut"
              defaultValue={statut}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
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
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
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
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Filtrer
            </button>
            <Link
              href="/stagiaires"
              className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold"
            >
              Reinitialiser
            </Link>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-background">
              <tr className="text-left text-sm text-muted">
                <th className="px-5 py-4 font-medium">Nom</th>
                <th className="px-5 py-4 font-medium">Etablissement</th>
                <th className="px-5 py-4 font-medium">Departement</th>
                <th className="px-5 py-4 font-medium">Statut</th>
                <th className="px-5 py-4 font-medium">Compte</th>
                <th className="px-5 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {stagiaires.length > 0 ? (
                stagiaires.map((stagiaire) => {
                  const latestStage = stagiaire.stages[0] ?? null;
                  const latestStageInfo = getLatestStageInfo(latestStage);

                  return (
                    <tr key={stagiaire.id} className="border-t border-border text-sm">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium">
                            {`${stagiaire.user.prenom} ${stagiaire.user.nom}`.trim()}
                          </p>
                          <p className="text-muted">{stagiaire.user.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted">{stagiaire.etablissement ?? "Non renseigne"}</td>
                      <td className="px-5 py-4 text-muted">{latestStageInfo.departement}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={latestStageInfo.statut} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={getAccountStatusLabel(stagiaire.user.isActive)} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={`/stagiaires/${stagiaire.id}`}
                            className="text-sm font-semibold text-primary hover:underline"
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
                              className="text-sm font-semibold text-foreground hover:underline"
                            >
                              {stagiaire.user.isActive ? "Archiver" : "Reactiver"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">
                    Aucun stagiaire ne correspond aux filtres actuels.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
