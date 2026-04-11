import Link from "next/link";
import { Clock3, FileText, Send, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
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

  return (
    <div className="space-y-8">
      {success === "saved" ? (
        <FeedbackBanner message="Le rapport a ete enregistre en brouillon." />
      ) : null}
      {success === "submitted" ? (
        <FeedbackBanner message="Le rapport a ete soumis avec succes." />
      ) : null}
      {success === "validated" ? (
        <FeedbackBanner message="Le rapport a ete valide." />
      ) : null}
      {success === "returned" ? (
        <FeedbackBanner message="Le rapport a ete retourne au stagiaire." />
      ) : null}

      <PageHeader
        eyebrow="Rapports hebdomadaires"
        title={pageTitle}
        description={pageDescription}
        actions={
          userRole === "STAGIAIRE" && activeStage ? (
            <Link
              href="/rapports/nouveau"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
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
          accent={<FileText className="h-5 w-5" />}
        />
        <MetricCard
          label="Brouillons"
          value={metrics.brouillons}
          helper="Rapports encore modifiables par le stagiaire"
          accent={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Soumis"
          value={metrics.soumis}
          helper="Rapports en attente de relecture"
          accent={<Send className="h-5 w-5" />}
        />
        <MetricCard
          label="Valides"
          value={metrics.valides}
          helper="Rapports clotures ou acceptes"
          accent={<ShieldCheck className="h-5 w-5" />}
        />
      </section>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Filtres</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Trouver un statut</h2>
        </div>
        <form className="flex flex-wrap items-end gap-3">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Statut</span>
            <select
              name="statut"
              defaultValue={statut}
              className="min-w-48 rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
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
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Appliquer
          </button>
          <Link
            href="/rapports"
            className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
          >
            Reinitialiser
          </Link>
        </form>
      </Card>

      {rapports.length > 0 ? (
        <div className="grid gap-4">
          {rapports.map((rapport) => (
            <Link key={rapport.id} href={`/rapports/${rapport.id}`}>
              <Card className="overflow-hidden p-0 transition hover:border-primary/40 hover:shadow-[0_18px_36px_-28px_rgba(15,118,110,0.45)]">
                <div className="grid gap-0 lg:grid-cols-[150px_1fr]">
                  <div className="bg-linear-to-b from-primary/10 to-primary/5 px-5 py-6 lg:border-r lg:border-border">
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
                      <div className="rounded-[22px] border border-border bg-background p-4">
                        <p className="text-sm text-muted">Soumis le</p>
                        <p className="mt-2 text-sm font-medium">{formatDate(rapport.dateSoumission)}</p>
                      </div>
                      <div className="rounded-[22px] border border-border bg-background p-4">
                        <p className="text-sm text-muted">Encadrant</p>
                        <p className="mt-2 text-sm font-medium">
                          {rapport.stage.encadrant
                            ? `${rapport.stage.encadrant.prenom} ${rapport.stage.encadrant.nom}`.trim()
                            : "Non affecte"}
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-border bg-background p-4">
                        <p className="text-sm text-muted">Commentaire</p>
                        <p className="mt-2 line-clamp-2 text-sm font-medium">
                          {rapport.commentaireEncadrant ?? "Aucun commentaire encadrant pour le moment."}
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
          title="Aucun rapport pour ce filtre"
          description="Aucun rapport ne correspond aux criteres actuels. Elargissez le filtre ou creez un nouveau rapport si votre stage est actif."
          actionHref={userRole === "STAGIAIRE" && activeStage ? "/rapports/nouveau" : "/rapports"}
          actionLabel={userRole === "STAGIAIRE" && activeStage ? "Creer un rapport" : "Voir tous les rapports"}
        />
      )}
    </div>
  );
}
