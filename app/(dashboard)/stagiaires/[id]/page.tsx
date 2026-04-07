import Link from "next/link";
import { notFound } from "next/navigation";
import { toggleStagiaireArchiveAction } from "@/app/(dashboard)/stagiaires/actions";
import { Card } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, getAccountStatusLabel, getLatestStageInfo } from "@/lib/stagiaires";
import { getStageStatusLabel } from "@/lib/stages";
import { prisma } from "@/lib/prisma";

type StagiaireDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StagiaireDetailPage({
  params,
  searchParams,
}: StagiaireDetailPageProps) {
  const { id } = await params;
  const success = getStringParam(((await searchParams) ?? {}).success)?.trim() ?? "";

  const stagiaire = await prisma.stagiaire.findUnique({
    where: { id },
    include: {
      user: true,
      stages: {
        orderBy: [{ createdAt: "desc" }],
        take: 1,
        include: {
          encadrant: true,
        },
      },
    },
  });

  if (!stagiaire) {
    notFound();
  }

  const latestStage = stagiaire.stages[0] ?? null;
  const latestStageInfo = getLatestStageInfo(latestStage);

  return (
    <div className="space-y-6">
      {success === "updated" ? (
        <FeedbackBanner message="La fiche stagiaire a ete mise a jour avec succes." />
      ) : null}
      {success === "archived" ? (
        <FeedbackBanner message="Le compte du stagiaire a ete archive." />
      ) : null}
      {success === "restored" ? (
        <FeedbackBanner message="Le compte du stagiaire a ete reactive." />
      ) : null}
      {success === "stage-created" ? (
        <FeedbackBanner message="Le stage a ete cree avec succes." />
      ) : null}
      {success === "stage-updated" ? (
        <FeedbackBanner message="Le stage a ete mis a jour avec succes." />
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">Fiche stagiaire</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {`${stagiaire.user.prenom} ${stagiaire.user.nom}`.trim()}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            Consultez les informations du stagiaire, son etat de compte et son dernier stage connu.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/stagiaires"
            className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold"
          >
            Retour a la liste
          </Link>
          <Link
            href={`/stagiaires/${stagiaire.id}/modifier`}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Modifier
          </Link>

          <form action={toggleStagiaireArchiveAction}>
            <input type="hidden" name="stagiaireId" value={stagiaire.id} />
            <input type="hidden" name="userId" value={stagiaire.user.id} />
            <input
              type="hidden"
              name="nextActiveValue"
              value={String(!stagiaire.user.isActive)}
            />
            <input type="hidden" name="returnTo" value={`/stagiaires/${stagiaire.id}`} />
            <button
              type="submit"
              className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold"
            >
              {stagiaire.user.isActive ? "Archiver" : "Reactiver"}
            </button>
          </form>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Email</p>
          <p className="mt-3 text-sm font-medium">{stagiaire.user.email}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Compte</p>
          <div className="mt-3">
            <StatusBadge status={getAccountStatusLabel(stagiaire.user.isActive)} />
          </div>
        </Card>
        <Card>
          <p className="text-sm text-muted">Statut stage</p>
          <div className="mt-3">
            <StatusBadge status={latestStageInfo.statut} />
          </div>
        </Card>
        <Card>
          <p className="text-sm text-muted">Departement</p>
          <p className="mt-3 text-sm font-medium">{latestStageInfo.departement}</p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Informations personnelles</h2>
            <p className="mt-2 text-sm text-muted">Donnees administratives du stagiaire.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Nom" value={stagiaire.user.nom} />
            <DetailItem label="Prenom" value={stagiaire.user.prenom} />
            <DetailItem label="CIN" value={stagiaire.cin} />
            <DetailItem label="Telephone" value={stagiaire.telephone ?? "Non renseigne"} />
            <DetailItem label="Date de naissance" value={formatDate(stagiaire.dateNaissance)} />
            <DetailItem label="Photo URL" value={stagiaire.photoUrl ?? "Non renseignee"} />
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Informations academiques</h2>
            <p className="mt-2 text-sm text-muted">Reference de l etablissement et du parcours.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Etablissement" value={stagiaire.etablissement ?? "Non renseigne"} />
            <DetailItem label="Specialite" value={stagiaire.specialite ?? "Non renseignee"} />
            <DetailItem label="Niveau" value={stagiaire.niveau ?? "Non renseigne"} />
            <DetailItem label="Annee universitaire" value={stagiaire.annee ?? "Non renseignee"} />
            <DetailItem label="Encadrant" value={latestStageInfo.encadrant} />
            <DetailItem label="Derniere mise a jour" value={formatDate(stagiaire.updatedAt)} />
          </div>
        </Card>
      </section>

      <Card className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Informations de stage</h2>
            <p className="mt-2 text-sm text-muted">
              Dernier stage connu pour ce stagiaire avec affectation et statut.
            </p>
          </div>

          {latestStage ? (
            <Link
              href={`/stages/${latestStage.id}/modifier`}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Modifier le stage
            </Link>
          ) : (
            <Link
              href={`/stagiaires/${stagiaire.id}/stage/nouveau`}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Creer un stage
            </Link>
          )}
        </div>

        {latestStage ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="Sujet" value={latestStage.sujet} />
            <DetailItem label="Departement" value={latestStage.departement} />
            <DetailItem label="Encadrant" value={latestStageInfo.encadrant} />
            <DetailItem label="Date de debut" value={formatDate(latestStage.dateDebut)} />
            <DetailItem label="Date de fin" value={formatDate(latestStage.dateFin)} />
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm text-muted">Statut</p>
              <div className="mt-2">
                <StatusBadge status={getStageStatusLabel(latestStage.statut)} />
              </div>
            </div>
            <DetailItem label="Depot GitHub" value={latestStage.githubRepo ?? "Non renseigne"} />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted">
            Aucun stage n est encore rattache a ce stagiaire.
          </div>
        )}
      </Card>
    </div>
  );
}
