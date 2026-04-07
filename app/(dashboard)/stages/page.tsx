import Link from "next/link";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { getStageStatusLabel } from "@/lib/stages";

type StagesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StagesPage({ searchParams }: StagesPageProps) {
  const session = await auth();
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

  return (
    <div className="space-y-6">
      {success === "created" ? (
        <FeedbackBanner message="Le stage a ete cree avec succes." />
      ) : null}
      {success === "updated" ? (
        <FeedbackBanner message="Le stage a ete modifie avec succes." />
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">Suivi des stages</p>
          <h1 className="text-3xl font-semibold tracking-tight">Liste des stages</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            Vue de suivi des stages avec affectation, statut et acces rapide vers la fiche stagiaire.
          </p>
        </div>

        {session?.user.role !== "ENCADRANT" ? (
          <Link
            href="/stagiaires"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Creer un stage depuis une fiche stagiaire
          </Link>
        ) : null}
      </div>

      <Card>
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
              placeholder="Informatique..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
            />
          </label>

          <div className="flex flex-wrap items-end gap-3">
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Filtrer
            </button>
            <Link
              href="/stages"
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
                <th className="px-5 py-4 font-medium">Stagiaire</th>
                <th className="px-5 py-4 font-medium">Departement</th>
                <th className="px-5 py-4 font-medium">Encadrant</th>
                <th className="px-5 py-4 font-medium">Periode</th>
                <th className="px-5 py-4 font-medium">Statut</th>
                <th className="px-5 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {stages.length > 0 ? (
                stages.map((stage) => (
                  <tr key={stage.id} className="border-t border-border text-sm">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">
                          {`${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom}`.trim()}
                        </p>
                        <p className="text-muted">{stage.sujet}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted">{stage.departement}</td>
                    <td className="px-5 py-4 text-muted">
                      {stage.encadrant
                        ? `${stage.encadrant.prenom} ${stage.encadrant.nom}`.trim()
                        : "Non affecte"}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {stage.dateDebut.toISOString().slice(0, 10)} - {stage.dateFin.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={getStageStatusLabel(stage.statut)} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/stagiaires/${stage.stagiaireId}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          Voir stagiaire
                        </Link>
                        {session?.user.role !== "ENCADRANT" ? (
                          <Link
                            href={`/stages/${stage.id}/modifier`}
                            className="text-sm font-semibold text-foreground hover:underline"
                          >
                            Modifier
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">
                    Aucun stage ne correspond aux filtres actuels.
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
