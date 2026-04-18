import Link from "next/link";
import { FileArchive, FileCheck2, FileClock, FileX2 } from "lucide-react";
import { auth } from "@/auth";
import { requestPdfGenerationAction } from "@/app/(dashboard)/documents/actions";
import { PdfGenerationForm } from "@/components/features/documents/pdf-generation-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatDocumentSize,
  getDocumentSourceLabel,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
  getSignatureStatusLabel,
  getDocumentVisibilityFilter,
} from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/stagiaires";

type DocumentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getDocumentNextActionLabel(status: string, signatureStatus: string) {
  if (status === "REJETE") {
    return "Correction ou nouveau depot attendu.";
  }

  if (status === "DEPOSE") {
    return "Soumettre le document en verification.";
  }

  if (status === "EN_VERIFICATION") {
    return "Revue documentaire en cours.";
  }

  if (status === "VALIDE" && signatureStatus === "NOT_REQUESTED") {
    return "Document valide, pret pour la preparation de signature.";
  }

  if (status === "VALIDE" && signatureStatus === "READY") {
    return "Signature a finaliser.";
  }

  if (status === "VALIDE" && signatureStatus === "SIGNED") {
    return "Document finalise et disponible.";
  }

  return "Consulter le detail du document.";
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const params = (await searchParams) ?? {};
  const statut = getStringParam(params.statut)?.trim() ?? "";
  const type = getStringParam(params.type)?.trim() ?? "";
  const success = getStringParam(params.success)?.trim() ?? "";

  const visibilityFilter = getDocumentVisibilityFilter(session.user.role, session.user.id);

  const [documents, stages] = await Promise.all([
    prisma.document.findMany({
      where: {
        isDeleted: false,
        ...visibilityFilter,
        ...(statut ? { statut: statut as never } : {}),
        ...(type ? { type: type as never } : {}),
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
        auteur: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
    session.user.role === "STAGIAIRE"
      ? Promise.resolve([])
      : prisma.stage.findMany({
          where:
            session.user.role === "ENCADRANT" ? { encadrantId: session.user.id } : undefined,
          include: {
            stagiaire: {
              include: {
                user: true,
              },
            },
          },
          orderBy: [{ dateDebut: "desc" }],
        }),
  ]);

  const pendingCount = documents.filter((document) => document.statut === "EN_VERIFICATION").length;
  const validatedCount = documents.filter((document) => document.statut === "VALIDE").length;
  const rejectedCount = documents.filter((document) => document.statut === "REJETE").length;
  const hasActiveFilters = Boolean(statut || type);

  return (
    <div className="space-y-8">
      {success === "generated" ? (
        <FeedbackBanner
          title="PDF genere"
          message="Le PDF a ete genere et ajoute aux documents."
          description="Vous pouvez maintenant l ouvrir, le verifier ou le traiter dans le workflow documentaire."
        />
      ) : null}

      <PageHeader
        eyebrow="Documents"
        title="Workflow documentaire"
        description="Centralisez les depots, la revue, les rejets et les PDF standards generes pour chaque stage."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Documents visibles"
          value={documents.length}
          helper="Documents accessibles selon votre role et votre perimetre"
          accent={<FileArchive className="h-5 w-5" />}
        />
        <MetricCard
          label="En verification"
          value={pendingCount}
          helper="Documents en attente de revue ou de validation"
          accent={<FileClock className="h-5 w-5" />}
        />
        <MetricCard
          label="Valides"
          value={validatedCount}
          helper="Documents valides et prets a etre telecharges"
          accent={<FileCheck2 className="h-5 w-5" />}
        />
        <MetricCard
          label="Rejetes"
          value={rejectedCount}
          helper="Documents retournes avec action attendue"
          accent={<FileX2 className="h-5 w-5" />}
        />
      </section>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Filtres</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Cibler un lot documentaire</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Filtrez par statut ou type pour retrouver rapidement le bon document a traiter.
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
              <option value="DEPOSE">Depose</option>
              <option value="EN_VERIFICATION">En verification</option>
              <option value="VALIDE">Valide</option>
              <option value="REJETE">Rejete</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Type</span>
            <input
              name="type"
              defaultValue={type}
              placeholder="CONVENTION, RAPPORT..."
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
              href="/documents"
              className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Revenir a la liste complete
            </Link>
          </div>
        </form>
      </Card>

      {session.user.role !== "STAGIAIRE" ? (
        <PdfGenerationForm
          stages={stages.map((stage) => ({
            id: stage.id,
            label: `${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom} · ${stage.departement} · ${stage.sujet}`,
          }))}
          action={requestPdfGenerationAction}
        />
      ) : null}

      {documents.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {documents.map((document) => (
            <Card key={document.id} className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={getDocumentStatusLabel(document.statut)} />
                    <StatusBadge status={getDocumentSourceLabel(document.source)} />
                    <StatusBadge status={getSignatureStatusLabel(document.signatureStatus)} />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">{document.nom}</h2>
                  <p className="text-sm leading-6 text-muted">
                    {`${document.stage.stagiaire.user.prenom} ${document.stage.stagiaire.user.nom}`.trim()} ·{" "}
                    {document.stage.departement}
                  </p>
                </div>

                <Link
                  href={`/documents/${document.id}`}
                  className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Ouvrir
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Type</p>
                  <p className="mt-2 text-sm font-medium">{getDocumentTypeLabel(document.type)}</p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Taille</p>
                  <p className="mt-2 text-sm font-medium">{formatDocumentSize(document.tailleOctets)}</p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Version</p>
                  <p className="mt-2 text-sm font-medium">v{document.version}</p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4 sm:col-span-2">
                  <p className="text-sm text-muted">Auteur</p>
                  <p className="mt-2 text-sm font-medium">
                    {`${document.auteur.prenom} ${document.auteur.nom}`.trim()}
                  </p>
                  <p className="mt-1 text-xs text-muted">Maj {formatDate(document.updatedAt)}</p>
                </div>
                <div className="rounded-[22px] border border-border bg-background p-4">
                  <p className="text-sm text-muted">Action attendue</p>
                  <p className="mt-2 text-sm font-medium">
                    {getDocumentNextActionLabel(document.statut, document.signatureStatus)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="Documents"
          title={hasActiveFilters ? "Aucun document ne correspond a ces filtres" : "Aucun document a afficher"}
          description={
            hasActiveFilters
              ? "Revenez a la vue complete pour retrouver tous les documents visibles dans votre perimetre."
              : session.user.role === "STAGIAIRE"
                ? "Aucun document n est actuellement disponible dans votre espace."
                : "Aucun document n est visible pour le moment dans le perimetre courant."
          }
          actionHref={hasActiveFilters ? "/documents" : "/dashboard"}
          actionLabel={hasActiveFilters ? "Voir tous les documents" : "Retour au dashboard"}
        />
      )}
    </div>
  );
}
