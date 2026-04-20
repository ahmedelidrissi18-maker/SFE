import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { getRapportStatusLabel } from "@/lib/rapports";
import { formatDate } from "@/lib/stagiaires";

type RapportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getRapportNextActionLabel(status: string) {
  switch (status) {
    case "BROUILLON":
      return "Completer puis soumettre le rapport.";
    case "SOUMIS":
      return "En attente de relecture encadrant.";
    case "RETOURNE":
      return "Correction attendue avant nouvelle soumission.";
    case "VALIDE":
      return "Aucune action attendue, rapport cloture.";
    default:
      return "Verifier le detail du rapport.";
  }
}

export default async function RapportsPage({ searchParams }: RapportsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const success = getStringParam(params.success)?.trim() ?? "";
  const statut = getStringParam(params.statut)?.trim() ?? "";

  const userRole = session.user.role;

  const rapports = await prisma.rapport.findMany({
    where: {
      ...(statut ? { statut: statut as never } : {}),
      ...(userRole === "STAGIAIRE"
        ? {
            stage: {
              stagiaire: {
                userId: session.user.id,
              },
            },
          }
        : {}),
      ...(userRole === "ENCADRANT"
        ? {
            stage: {
              encadrantId: session.user.id,
            },
          }
        : {}),
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
    orderBy: [{ updatedAt: "desc" }],
  });

  const activeStage =
    userRole === "STAGIAIRE"
      ? await prisma.stage.findFirst({
          where: {
            stagiaire: {
              userId: session.user.id,
            },
            statut: {
              in: ["PLANIFIE", "EN_COURS", "SUSPENDU"],
            },
          },
          orderBy: [{ dateDebut: "desc" }],
        })
      : null;

  const metrics = {
    total: rapports.length,
    brouillons: rapports.filter((rapport) => rapport.statut === "BROUILLON").length,
    soumis: rapports.filter((rapport) => rapport.statut === "SOUMIS").length,
    valides: rapports.filter((rapport) => rapport.statut === "VALIDE").length,
  };

  const pageTitle =
    userRole === "STAGIAIRE"
      ? "Mes rapports"
      : userRole === "ENCADRANT"
        ? "Rapports de mes stagiaires"
        : "Suivi des rapports";

  const pageDescription =
    userRole === "STAGIAIRE"
      ? "Retrouvez l historique de vos rapports, leur statut et l avancement declare pour votre stage."
      : "Consultez les rapports, identifiez ceux qui exigent une action et suivez le cycle de validation de bout en bout.";
  const hasActiveFilters = Boolean(statut);

  return (
    <div className="space-y-8">
      {success === "saved" ? (
        <FeedbackBanner
          title="Brouillon enregistre"
          message="Le rapport a ete enregistre en brouillon."
          description="Vous pouvez revenir plus tard pour le completer avant soumission."
        />
      ) : null}
      {success === "submitted" ? (
        <FeedbackBanner
          title="Rapport soumis"
          message="Le rapport a ete soumis avec succes."
          description="Il est maintenant disponible pour relecture dans le workflow de validation."
        />
      ) : null}
      {success === "validated" ? (
        <FeedbackBanner
          title="Rapport valide"
          message="Le rapport a ete valide."
          description="Le cycle hebdomadaire correspondant est cloture pour ce rapport."
        />
      ) : null}
      {success === "returned" ? (
        <FeedbackBanner
          title="Rapport retourne"
          message="Le rapport a ete retourne au stagiaire."
          description="Un ajustement est attendu avant une nouvelle soumission."
        />
      ) : null}

      <PageHeader
        eyebrow="Rapports hebdomadaires"
        title={pageTitle}
        description={pageDescription}
        actions={
          userRole === "STAGIAIRE" && activeStage ? (
            <Link
              href="/rapports/nouveau"
              className="action-button action-button-primary px-5 py-3 text-sm"
            >
              Nouveau rapport
            </Link>
          ) : null
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Rapports"
          value={metrics.total}
          helper="Historique visible selon votre role"
          accent={<MaterialSymbol icon="description" className="text-[20px]" />}
        />
        <MetricCard
          label="Brouillons"
          value={metrics.brouillons}
          helper="Rapports encore modifiables par le stagiaire"
          accent={<MaterialSymbol icon="edit_document" className="text-[20px]" />}
        />
        <MetricCard
          label="Soumis"
          value={metrics.soumis}
          helper="Rapports en attente de relecture"
          accent={<MaterialSymbol icon="send" className="text-[20px]" />}
        />
        <MetricCard
          label="Valides"
          value={metrics.valides}
          helper="Rapports clotures ou acceptes"
          accent={<MaterialSymbol icon="task_alt" className="text-[20px]" filled />}
        />
      </section>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Filtres</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Trouver un statut</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Utilisez ce filtre pour isoler rapidement les brouillons, les rapports soumis ou les retours a traiter.
          </p>
        </div>
        <form className="flex flex-wrap items-end gap-3">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Statut</span>
            <select
              name="statut"
              defaultValue={statut}
              className="field-shell min-w-48 rounded-2xl px-4 py-3 outline-none transition"
            >
              <option value="">Tous</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="SOUMIS">Soumis</option>
              <option value="VALIDE">Valide</option>
              <option value="RETOURNE">Retourne</option>
            </select>
          </label>

          <button
            type="submit"
            className="action-button action-button-primary px-5 py-3 text-sm"
          >
            Appliquer les filtres
          </button>
          <Link
            href="/rapports"
            className="action-button action-button-secondary px-5 py-3 text-sm"
          >
            Revenir a la liste complete
          </Link>
        </form>
      </Card>

      {rapports.length > 0 ? (
        <div className="grid gap-4">
          {rapports.map((rapport) => (
            <Link key={rapport.id} href={`/rapports/${rapport.id}`}>
              <Card className="overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-[0px_18px_36px_rgba(26,28,29,0.08)]">
                <div className="grid gap-0 lg:grid-cols-[150px_1fr]">
                  <div className="bg-linear-to-b from-primary/10 to-primary/5 px-5 py-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Semaine</p>
                    <p className="mt-2 text-4xl font-semibold tracking-tight">{rapport.semaine}</p>
                    <p className="mt-3 text-sm text-muted">{rapport.avancement}% d avancement</p>
                  </div>

                  <div className="space-y-5 px-5 py-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={getRapportStatusLabel(rapport.statut)} />
                          <span className="text-xs uppercase tracking-[0.18em] text-muted">
                            {formatDate(rapport.updatedAt)}
                          </span>
                        </div>
                        <h2 className="text-xl font-semibold tracking-tight">
                          {rapport.stage.stagiaire.user.prenom} {rapport.stage.stagiaire.user.nom}
                        </h2>
                        <p className="text-sm leading-6 text-muted">
                          {rapport.stage.departement} · {rapport.stage.sujet}
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-primary">Ouvrir le rapport</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="tonal-card rounded-[22px] p-4">
                        <p className="text-sm text-muted">
                          {rapport.commentaireEncadrant ? "Retour encadrant" : "Action attendue"}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm font-medium">
                          {rapport.commentaireEncadrant ?? getRapportNextActionLabel(rapport.statut)}
                        </p>
                      </div>
                      <div className="tonal-card rounded-[22px] p-4">
                        <p className="text-sm text-muted">Soumis le</p>
                        <p className="mt-2 text-sm font-medium">
                          {rapport.dateSoumission ? formatDate(rapport.dateSoumission) : "Non soumis"}
                        </p>
                      </div>
                      <div className="tonal-card rounded-[22px] p-4">
                        <p className="text-sm text-muted">Encadrant</p>
                        <p className="mt-2 text-sm font-medium">
                          {rapport.stage.encadrant
                            ? `${rapport.stage.encadrant.prenom} ${rapport.stage.encadrant.nom}`.trim()
                            : "Non affecte"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="Rapports"
          title={hasActiveFilters ? "Aucun rapport ne correspond a ce statut" : "Aucun rapport visible"}
          description={
            hasActiveFilters
              ? "Elargissez le filtre ou revenez a la liste complete pour retrouver les rapports disponibles."
              : userRole === "STAGIAIRE" && activeStage
                ? "Votre stage est actif mais aucun rapport n a encore ete cree pour ce perimetre."
                : "Aucun rapport n est actuellement visible dans votre perimetre."
          }
          actionHref={
            hasActiveFilters
              ? "/rapports"
              : userRole === "STAGIAIRE" && activeStage
                ? "/rapports/nouveau"
                : "/dashboard"
          }
          actionLabel={
            hasActiveFilters
              ? "Voir tous les rapports"
              : userRole === "STAGIAIRE" && activeStage
                ? "Creer un rapport"
                : "Retour au dashboard"
          }
          secondaryActionHref={hasActiveFilters && userRole === "STAGIAIRE" && activeStage ? "/rapports/nouveau" : undefined}
          secondaryActionLabel={hasActiveFilters && userRole === "STAGIAIRE" && activeStage ? "Creer un rapport" : undefined}
        />
      )}
    </div>
  );
}
