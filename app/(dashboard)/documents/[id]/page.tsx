import Link from "next/link";
import { CheckCircle2, FileArchive, FileClock, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { transitionDocumentWorkflowAction } from "@/app/(dashboard)/documents/actions";
import { DocumentReviewForm } from "@/components/features/documents/document-review-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  canAccessStageDocuments,
  canManageDocumentReview,
  canPrepareDocumentSignature,
  canReviewDocument,
  canSubmitDocumentForReview,
  formatDocumentSize,
  getDocumentSourceLabel,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
  getSignatureStatusLabel,
} from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/stagiaires";

type DocumentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(date?: Date | null) {
  if (!date) {
    return "Non renseignee";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function DocumentDetailPage({
  params,
  searchParams,
}: DocumentDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const success = getStringParam(((await searchParams) ?? {}).success)?.trim() ?? "";

  const document = await prisma.document.findUnique({
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
      auteur: true,
    },
  });

  if (!document || document.isDeleted) {
    notFound();
  }

  const hasAccess = canAccessStageDocuments(session.user.role, {
    isStageOwner: document.stage.stagiaire.userId === session.user.id,
    isAssignedEncadrant: document.stage.encadrantId === session.user.id,
  });

  if (!hasAccess) {
    redirect("/acces-refuse");
  }

  const canSubmit = canSubmitDocumentForReview(document.statut);
  const canReview =
    canManageDocumentReview(session.user.role, {
      isAssignedEncadrant: document.stage.encadrantId === session.user.id,
    }) && canReviewDocument(document.statut);
  const canPrepareSignature =
    canPrepareDocumentSignature(session.user.role) &&
    document.statut === "VALIDE" &&
    document.signatureStatus === "NOT_REQUESTED";
  const canMarkSigned =
    canPrepareDocumentSignature(session.user.role) &&
    document.signatureStatus === "READY";

  const timelineItems = [
    {
      label: "Depot initial",
      helper: `${getDocumentSourceLabel(document.source)} par ${document.auteur.prenom} ${document.auteur.nom}`.trim(),
      date: document.createdAt,
      icon: FileArchive,
    },
    ...(document.validationRequestedAt
      ? [
          {
            label: "Demande de verification",
            helper: "Le document a ete envoye en revue documentaire.",
            date: document.validationRequestedAt,
            icon: FileClock,
          },
        ]
      : []),
    ...(document.reviewedAt
      ? [
          {
            label: "Revue documentaire",
            helper: `Statut final de revue : ${getDocumentStatusLabel(document.statut)}`,
            date: document.reviewedAt,
            icon: CheckCircle2,
          },
        ]
      : []),
    ...(document.signaturePreparedAt || document.signedAt
      ? [
          {
            label: "Signature",
            helper: `Etat de signature : ${getSignatureStatusLabel(document.signatureStatus)}`,
            date: document.signedAt ?? document.signaturePreparedAt ?? document.updatedAt,
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8">
      {success === "submitted" ? (
        <FeedbackBanner message="Le document a ete envoye en verification." />
      ) : null}
      {success === "validated" ? (
        <FeedbackBanner message="Le document a ete valide." />
      ) : null}
      {success === "rejected" ? (
        <FeedbackBanner message="Le document a ete rejete avec motif." />
      ) : null}
      {success === "signature-prepared" ? (
        <FeedbackBanner message="Le socle de signature a ete prepare pour ce document." />
      ) : null}
      {success === "signed" ? (
        <FeedbackBanner message="Le document est marque comme signe." />
      ) : null}

      <PageHeader
        eyebrow="Document"
        title={document.nom}
        description={`${document.stage.stagiaire.user.prenom} ${document.stage.stagiaire.user.nom} · ${document.stage.departement} · ${document.stage.sujet}`}
        actions={
          <>
            <StatusBadge status={getDocumentStatusLabel(document.statut)} />
            <Link
              href={`/api/documents/${document.id}`}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Telecharger
            </Link>
            <Link
              href="/documents"
              className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Retour aux documents
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Type</p>
          <p className="mt-3 text-sm font-medium">{getDocumentTypeLabel(document.type)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Source</p>
          <div className="mt-3">
            <StatusBadge status={getDocumentSourceLabel(document.source)} />
          </div>
        </Card>
        <Card>
          <p className="text-sm text-muted">Taille</p>
          <p className="mt-3 text-sm font-medium">{formatDocumentSize(document.tailleOctets)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Signature</p>
          <div className="mt-3">
            <StatusBadge status={getSignatureStatusLabel(document.signatureStatus)} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="space-y-5">
          <div>
            <p className="text-sm font-medium text-primary">Timeline</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Parcours du document</h2>
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
                      {formatDateTime(item.date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <p className="text-sm font-medium text-primary">Details</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Contexte et decisions</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Auteur</p>
              <p className="mt-2 text-sm font-medium">
                {`${document.auteur.prenom} ${document.auteur.nom}`.trim()}
              </p>
            </div>
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Version</p>
              <p className="mt-2 text-sm font-medium">v{document.version}</p>
            </div>
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Depose le</p>
              <p className="mt-2 text-sm font-medium">{formatDate(document.createdAt)}</p>
            </div>
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Derniere revision</p>
              <p className="mt-2 text-sm font-medium">{formatDate(document.updatedAt)}</p>
            </div>
            <div className="rounded-[22px] border border-border bg-background p-4 md:col-span-2">
              <p className="text-sm text-muted">Motif de rejet</p>
              <p className="mt-2 text-sm font-medium">
                {document.rejectionReason ?? "Aucun motif de rejet."}
              </p>
            </div>
            <div className="rounded-[22px] border border-border bg-background p-4 md:col-span-2">
              <p className="text-sm text-muted">Signature</p>
              <p className="mt-2 text-sm font-medium">
                Provider: {document.signatureProvider ?? "Non configure"} · Reference:{" "}
                {document.signatureReference ?? "Aucune"} · Signe le {formatDate(document.signedAt)}
              </p>
            </div>
          </div>
        </Card>
      </section>

      {canSubmit || canReview || canPrepareSignature || canMarkSigned ? (
        <DocumentReviewForm
          documentId={document.id}
          defaultComment={document.rejectionReason ?? ""}
          action={transitionDocumentWorkflowAction}
          canSubmit={canSubmit}
          canReview={canReview}
          canPrepareSignature={canPrepareSignature}
          canMarkSigned={canMarkSigned}
        />
      ) : (
        <EmptyState
          title="Aucune action disponible"
          description="Aucune transition documentaire n est accessible pour ce document dans votre perimetre actuel."
        />
      )}
    </div>
  );
}
