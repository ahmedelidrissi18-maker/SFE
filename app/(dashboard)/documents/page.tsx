import Link from "next/link";
import { auth } from "@/auth";
import { requestPdfGenerationAction } from "@/app/(dashboard)/documents/actions";
import { PdfGenerationForm } from "@/components/features/documents/pdf-generation-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MetricCard } from "@/components/ui/metric-card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatDocumentSize,
  getDocumentSourceLabel,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
  getDocumentVisibilityFilter,
  resolveDocumentStatus,
  resolveDocumentType,
  getSignatureStatusLabel,
} from "@/lib/documents";
import { getPaginationMeta, parsePageParam } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/stagiaires";

type DocumentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getDocumentOwnerLabel(user: { prenom?: string | null; nom?: string | null; email?: string | null }) {
  const fullName = `${user.prenom ?? ""} ${user.nom ?? ""}`.trim();
  return fullName || user.email || "Stagiaire";
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
  const rawStatut = getStringParam(params.statut)?.trim() ?? "";
  const rawType = getStringParam(params.type)?.trim() ?? "";
  const statut = resolveDocumentStatus(rawStatut);
  const type = resolveDocumentType(rawType);
  const success = getStringParam(params.success)?.trim() ?? "";
  const requestedPage = parsePageParam(params.page);
  const pageSize = 10;
  const visibilityFilter = getDocumentVisibilityFilter(session.user.role, session.user.id);
  const documentWhere = {
    isDeleted: false,
    ...visibilityFilter,
    ...(statut ? { statut } : {}),
    ...(type ? { type } : {}),
  };

  const [totalDocumentsCount, pendingCount, validatedCount, rejectedCount, stages] =
    await Promise.all([
      prisma.document.count({
        where: documentWhere,
      }),
      prisma.document.count({
        where: {
          ...documentWhere,
          statut: "EN_VERIFICATION",
        },
      }),
      prisma.document.count({
        where: {
          ...documentWhere,
          statut: "VALIDE",
        },
      }),
      prisma.document.count({
        where: {
          ...documentWhere,
          statut: "REJETE",
        },
      }),
      session.user.role === "STAGIAIRE"
        ? Promise.resolve([])
        : prisma.stage.findMany({
            where:
              session.user.role === "ENCADRANT"
                ? { encadrantId: session.user.id }
                : undefined,
            select: {
              id: true,
              departement: true,
              sujet: true,
              stagiaire: {
                select: {
                  user: {
                    select: {
                      prenom: true,
                      nom: true,
                      email: true,
                    },
                  },
                },
              },
            },
            orderBy: [{ dateDebut: "desc" }],
          }),
    ]);

  const pagination = getPaginationMeta({
    requestedPage,
    totalItems: totalDocumentsCount,
    pageSize,
  });

  const documents = await prisma.document.findMany({
    where: documentWhere,
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
    skip: pagination.skip,
    take: pagination.take,
  });

  const hasActiveFilters = Boolean(rawStatut || rawType);

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

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Documents visibles"
          value={totalDocumentsCount}
          helper="Documents accessibles selon votre role et votre perimetre"
          accent={<MaterialSymbol icon="folder" className="text-[20px]" />}
          className="p-4 min-h-[120px] overflow-hidden"
          labelClassName="text-[11px] uppercase tracking-wide truncate"
          valueClassName="text-2xl font-bold"
          helperClassName="text-xs leading-snug line-clamp-3"
          borderLeftClass="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
        />
        <MetricCard
          label="En verification"
          value={pendingCount}
          helper="Documents en attente de revue ou de validation"
          accent={<MaterialSymbol icon="pending_actions" className="text-[20px]" />}
          className="p-4 min-h-[120px] overflow-hidden"
          labelClassName="text-[11px] uppercase tracking-wide truncate"
          valueClassName="text-2xl font-bold"
          helperClassName="text-xs leading-snug line-clamp-3"
          borderLeftClass="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20"
        />
        <MetricCard
          label="Valides"
          value={validatedCount}
          helper="Documents valides et prets a etre telecharges"
          accent={<MaterialSymbol icon="task_alt" className="text-[20px]" filled />}
          className="p-4 min-h-[120px] overflow-hidden"
          labelClassName="text-[11px] uppercase tracking-wide truncate"
          valueClassName="text-2xl font-bold"
          helperClassName="text-xs leading-snug line-clamp-3"
          borderLeftClass="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20"
        />
        <MetricCard
          label="Rejetes"
          value={rejectedCount}
          helper="Documents retournes avec action attendue"
          accent={<MaterialSymbol icon="cancel" className="text-[20px]" filled />}
          className="p-4 min-h-[120px] overflow-hidden"
          labelClassName="text-[11px] uppercase tracking-wide truncate"
          valueClassName="text-2xl font-bold"
          helperClassName="text-xs leading-snug line-clamp-3"
          borderLeftClass="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20"
        />
      </section>

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Filtres</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-2xl border-l-4 border-primary pl-3">Cibler un lot documentaire</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-prose">
            Filtrez par statut ou type pour retrouver rapidement le bon document a traiter.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-3 rounded-xl border border-border p-6 bg-card">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Statut</span>
            <select
              name="statut"
              defaultValue={statut ?? ""}
              className="w-full rounded-lg bg-muted/30 border border-transparent px-4 py-3 text-sm outline-none transition focus:bg-background focus:border-border focus:ring-2 focus:ring-primary/20"
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
              defaultValue={rawType}
              placeholder="CONVENTION, RAPPORT..."
              className="w-full rounded-lg bg-muted/30 border border-transparent px-4 py-3 text-sm outline-none transition focus:bg-background focus:border-border focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <button
              type="submit"
              className="w-full px-6 py-2.5 text-sm sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50"
            >
              Appliquer les filtres
            </button>
            <Link
              href="/documents"
              className="action-button action-button-secondary w-full px-5 py-3 text-sm sm:w-auto"
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
            label: `${getDocumentOwnerLabel(stage.stagiaire.user)} · ${stage.departement} · ${stage.sujet}`,
          }))}
          action={requestPdfGenerationAction}
        />
      ) : null}

      {documents.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {documents.map((document) => (
              <Card key={document.id} className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={getDocumentStatusLabel(document.statut)} />
                      <StatusBadge status={getDocumentSourceLabel(document.source)} />
                      <StatusBadge status={getSignatureStatusLabel(document.signatureStatus)} />
                    </div>
                    <h2
                      className="line-clamp-2 break-words text-xl font-semibold tracking-tight sm:text-2xl"
                      title={document.nom}
                    >
                      {document.nom}
                    </h2>
                    <p className="line-clamp-1 text-sm leading-6 text-muted">
                      {getDocumentOwnerLabel(document.stage.stagiaire.user)} · {document.stage.departement}
                    </p>
                  </div>

                  <Link
                    href={`/documents/${document.id}`}
                    className="action-button action-button-primary shrink-0 whitespace-nowrap px-4 py-2.5 text-sm"
                  >
                    Ouvrir
                  </Link>
                </div>

                <div className="grid gap-3 min-[390px]:grid-cols-2 xl:grid-cols-3">
                  <div className="tonal-card rounded-[22px] p-4">
                    <p className="text-sm text-muted">Type</p>
                    <p className="mt-2 text-sm font-medium">{getDocumentTypeLabel(document.type)}</p>
                  </div>
                  <div className="tonal-card rounded-[22px] p-4">
                    <p className="text-sm text-muted">Taille</p>
                    <p className="mt-2 text-sm font-medium">{formatDocumentSize(document.tailleOctets)}</p>
                  </div>
                  <div className="tonal-card rounded-[22px] p-4">
                    <p className="text-sm text-muted">Version</p>
                    <p className="mt-2 text-sm font-medium">v{document.version}</p>
                  </div>
                  <div className="tonal-card rounded-[22px] p-4 sm:col-span-2">
                    <p className="text-sm text-muted">Auteur</p>
                    <p className="mt-2 text-sm font-medium">
                      {`${document.auteur.prenom} ${document.auteur.nom}`.trim()}
                    </p>
                    <p className="mt-1 text-xs text-muted">Maj {formatDate(document.updatedAt)}</p>
                  </div>
                  <div className="tonal-card rounded-[22px] p-4">
                    <p className="text-sm text-muted">Action attendue</p>
                    <p className="mt-2 text-sm font-medium">
                      {getDocumentNextActionLabel(document.statut, document.signatureStatus)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <PaginationControls
            pathname="/documents"
            searchParams={params}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
            itemLabel="documents"
          />
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
