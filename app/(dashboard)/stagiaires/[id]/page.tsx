import Link from "next/link";
import { FileText, FolderOpenDot, GraduationCap, Mail, UserSquare2 } from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { uploadDocumentAction } from "@/app/(dashboard)/documents/actions";
import {
  linkGithubAccountAction,
  syncGithubActivityAction,
} from "@/app/(dashboard)/stagiaires/github-actions";
import { toggleStagiaireArchiveAction } from "@/app/(dashboard)/stagiaires/actions";
import { DocumentUploadForm } from "@/components/features/documents/document-upload-form";
import { GithubIntegrationCard } from "@/components/features/github/github-integration-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatDocumentSize,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
} from "@/lib/documents";
import {
  getEvaluationStatusLabel,
  getEvaluationTypeLabel,
} from "@/lib/evaluations";
import { getGithubSyncStatusLabel, githubService } from "@/lib/github/service";
import { getRapportStatusLabel } from "@/lib/rapports";
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
    <div className="rounded-[22px] border border-border bg-background p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6">{value}</p>
    </div>
  );
}

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getGithubErrorMessage(code: string) {
  const messages: Record<string, string> = {
    missing_stagiaire: "La liaison GitHub n a pas pu demarrer : stagiaire manquant.",
    unknown_stagiaire: "Le stagiaire cible pour la connexion GitHub est introuvable.",
    oauth_not_configured: "GitHub OAuth n est pas configure dans l environnement.",
    oauth_state_invalid: "La verification de securite GitHub a echoue. Merci de relancer la connexion.",
    oauth_denied: "La connexion GitHub a ete annulee par l utilisateur ou refusee par GitHub.",
    oauth_code_missing: "Le code d autorisation GitHub est manquant.",
    oauth_callback_failed: "La finalisation OAuth GitHub a echoue. Merci de reessayer.",
    link_failed: "Le compte GitHub n a pas pu etre lie au stagiaire.",
  };

  return messages[code] ?? "";
}

export default async function StagiaireDetailPage({
  params,
  searchParams,
}: StagiaireDetailPageProps) {
  const session = await auth();
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const success = getStringParam(resolvedSearchParams.success)?.trim() ?? "";
  const githubErrorCode = getStringParam(resolvedSearchParams.githubError)?.trim() ?? "";
  const githubErrorMessage = getGithubErrorMessage(githubErrorCode);

  const stagiaire = await prisma.stagiaire.findUnique({
    where: { id },
    include: {
      user: true,
      stages: {
        orderBy: [{ createdAt: "desc" }],
        take: 1,
        include: {
          encadrant: true,
          rapports: {
            orderBy: [{ updatedAt: "desc" }],
            take: 3,
          },
          evaluations: {
            orderBy: [{ updatedAt: "desc" }],
          },
          documents: {
            where: {
              isDeleted: false,
            },
            include: {
              auteur: true,
            },
            orderBy: [{ createdAt: "desc" }],
          },
        },
      },
    },
  });

  if (!stagiaire) {
    notFound();
  }

  const latestStage = stagiaire.stages[0] ?? null;
  const latestStageInfo = getLatestStageInfo(latestStage);
  const githubSummary = await githubService.getSummary(stagiaire.id);
  const latestGithubPayload =
    githubSummary.latestSync?.payload &&
    typeof githubSummary.latestSync.payload === "object" &&
    githubSummary.latestSync.payload !== null
      ? (githubSummary.latestSync.payload as {
          repository?: {
            fullName?: string;
            description?: string | null;
          };
          recentCommits?: Array<{
            sha: string;
            message: string;
            htmlUrl: string;
          }>;
        })
      : null;

  return (
    <div className="space-y-8">
      {success === "updated" ? (
        <FeedbackBanner
          title="Fiche mise a jour"
          message="La fiche stagiaire a ete mise a jour avec succes."
          description="Les informations de suivi sont maintenant rafraichies sur l ensemble de la fiche."
        />
      ) : null}
      {success === "archived" ? (
        <FeedbackBanner
          title="Compte archive"
          message="Le compte du stagiaire a ete archive."
          description="La fiche reste visible pour le suivi, mais l acces de connexion est desactive."
        />
      ) : null}
      {success === "restored" ? (
        <FeedbackBanner
          title="Compte reactive"
          message="Le compte du stagiaire a ete reactive."
          description="Le stagiaire peut de nouveau acceder a la plateforme si ses autres droits sont en place."
        />
      ) : null}
      {success === "stage-created" ? (
        <FeedbackBanner
          title="Stage cree"
          message="Le stage a ete cree avec succes."
          description="Le perimetre de suivi est maintenant disponible sur cette fiche."
        />
      ) : null}
      {success === "stage-updated" ? (
        <FeedbackBanner
          title="Stage mis a jour"
          message="Le stage a ete mis a jour avec succes."
          description="Les informations de contexte et de supervision ont ete actualisees."
        />
      ) : null}
      {success === "document-uploaded" ? (
        <FeedbackBanner
          title="Document ajoute"
          message="Le document a ete ajoute avec succes."
          description="Il apparait maintenant dans la section documentaire de cette fiche."
        />
      ) : null}
      {success === "github-linked" ? (
        <FeedbackBanner
          title="Compte GitHub lie"
          message="Le compte GitHub a ete lie avec succes."
          description="Le suivi des synchronisations GitHub est maintenant disponible sur la fiche."
        />
      ) : null}
      {success === "github-synced" ? (
        <FeedbackBanner
          title="Synchronisation terminee"
          message="La synchronisation GitHub a ete executee avec succes."
          description="Les derniers indicateurs GitHub viennent d etre mis a jour."
        />
      ) : null}
      {githubErrorMessage ? (
        <FeedbackBanner kind="error" message={githubErrorMessage} />
      ) : null}

      <PageHeader
        eyebrow="Fiche stagiaire"
        title={`${stagiaire.user.prenom} ${stagiaire.user.nom}`.trim()}
        description="Consultez les informations personnelles, academiques et de stage du stagiaire, avec les derniers documents et rapports relies a son perimetre."
        actions={
          <>
            <Link
              href="/stagiaires"
              className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Retour a la liste
            </Link>
            <Link
              href={`/stagiaires/${stagiaire.id}/modifier`}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
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
                className="rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
              >
                {stagiaire.user.isActive ? "Archiver" : "Reactiver"}
              </button>
            </form>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-5 bg-linear-to-br from-card via-card to-accent/40">
          <div className="flex items-center gap-4">
            {stagiaire.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stagiaire.photoUrl}
                alt={`${stagiaire.user.prenom} ${stagiaire.user.nom}`}
                className="h-20 w-20 rounded-[24px] object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary/10 text-primary">
                <UserSquare2 className="h-9 w-9" />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={getAccountStatusLabel(stagiaire.user.isActive)} />
                <StatusBadge status={latestStageInfo.statut} />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {`${stagiaire.user.prenom} ${stagiaire.user.nom}`.trim()}
              </h2>
              <p className="text-sm text-muted">
                {stagiaire.specialite ?? "Specialite non renseignee"}
              </p>
              <p className="text-sm leading-6 text-muted">
                {latestStage
                  ? `Stage ${getStageStatusLabel(latestStage.statut).toLowerCase()} dans ${latestStage.departement}.`
                  : "Aucun stage n est encore rattache a cette fiche."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Email" value={stagiaire.user.email} />
            <DetailItem label="Telephone" value={stagiaire.telephone ?? "Non renseigne"} />
            <DetailItem label="Sujet du stage" value={latestStage?.sujet ?? "Aucun stage rattache"} />
            <DetailItem label="Encadrant actuel" value={latestStageInfo.encadrant} />
          </div>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Compte"
            value={getAccountStatusLabel(stagiaire.user.isActive)}
            helper="Etat actuel du compte de connexion"
            accent={<Mail className="h-5 w-5" />}
          />
          <MetricCard
            label="Stage"
            value={latestStage ? getStageStatusLabel(latestStage.statut) : "Aucun"}
            helper="Dernier stage rattache a la fiche"
            accent={<FolderOpenDot className="h-5 w-5" />}
          />
          <MetricCard
            label="Documents"
            value={latestStage?.documents.length ?? 0}
            helper="Pieces visibles sur le stage courant"
            accent={<FileText className="h-5 w-5" />}
          />
          <MetricCard
            label="Evaluations"
            value={latestStage?.evaluations.length ?? 0}
            helper="Evaluations planifiees ou historisees sur ce stage"
            accent={<GraduationCap className="h-5 w-5" />}
          />
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">Informations personnelles</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Identite et contact</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Retrouvez les informations de contact et les elements administratifs utiles au suivi.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Nom" value={stagiaire.user.nom} />
            <DetailItem label="Prenom" value={stagiaire.user.prenom} />
            <DetailItem label="CIN" value={stagiaire.cin} />
            <DetailItem label="Date de naissance" value={formatDate(stagiaire.dateNaissance)} />
            <DetailItem label="Telephone" value={stagiaire.telephone ?? "Non renseigne"} />
            <DetailItem label="Email" value={stagiaire.user.email} />
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium text-primary">Informations academiques</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Parcours et rattachement</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Cette zone regroupe l etablissement, le niveau et les informations de cadrage du
              stage courant.
            </p>
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

      <Card className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Stage</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Perimetre de stage</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Dernier stage connu, son encadrant, son statut et les donnees de contexte utiles a la supervision.
            </p>
          </div>

          {latestStage ? (
            <Link
              href={`/stages/${latestStage.id}/modifier`}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Modifier le stage
            </Link>
          ) : (
            <Link
              href={`/stagiaires/${stagiaire.id}/stage/nouveau`}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Creer un stage
            </Link>
          )}
        </div>

        {latestStage ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailItem label="Sujet" value={latestStage.sujet} />
            <DetailItem label="Departement" value={latestStage.departement} />
            <DetailItem label="Encadrant" value={latestStageInfo.encadrant} />
            <DetailItem label="Date de debut" value={formatDate(latestStage.dateDebut)} />
            <DetailItem label="Date de fin" value={formatDate(latestStage.dateFin)} />
            <div className="rounded-[22px] border border-border bg-background p-4">
              <p className="text-sm text-muted">Statut</p>
              <div className="mt-2">
                <StatusBadge status={getStageStatusLabel(latestStage.statut)} />
              </div>
            </div>
            <DetailItem label="Depot GitHub" value={latestStage.githubRepo ?? "Non renseigne"} />
            <DetailItem label="Derniere mise a jour" value={formatDate(latestStage.updatedAt)} />
          </div>
        ) : (
          <EmptyState
            title="Aucun stage rattache"
            description="Cette fiche stagiaire ne contient pas encore de stage. Creez un stage pour demarrer le suivi metier."
            actionHref={`/stagiaires/${stagiaire.id}/stage/nouveau`}
            actionLabel="Creer un stage"
          />
        )}
      </Card>

      {session?.user && (session.user.role === "ADMIN" || session.user.role === "RH") ? (
        <GithubIntegrationCard
          stagiaireId={stagiaire.id}
          repositoryUrl={latestStage?.githubRepo ?? null}
          oauthConnectHref={`/api/github/connect?stagiaireId=${stagiaire.id}&returnTo=${encodeURIComponent(
            `/stagiaires/${stagiaire.id}`,
          )}`}
          summaryHref={`/stagiaires/${stagiaire.id}/github`}
          connection={
            githubSummary.connection
              ? {
                  username: githubSummary.connection.username,
                  profileUrl: githubSummary.connection.profileUrl,
                  avatarUrl: githubSummary.connection.avatarUrl,
                  lastSyncError: githubSummary.connection.lastSyncError,
                }
              : null
          }
          latestSync={
            githubSummary.latestSync
              ? {
                  statusLabel: getGithubSyncStatusLabel(githubSummary.latestSync.status),
                  synchronizedAtLabel: formatDate(githubSummary.latestSync.synchronizedAt),
                  commitsCount: githubSummary.latestSync.commitsCount,
                  pullRequestsCount: githubSummary.latestSync.pullRequestsCount,
                  issuesCount: githubSummary.latestSync.issuesCount,
                  payload: latestGithubPayload,
                }
              : null
          }
          linkAction={linkGithubAccountAction}
          syncAction={syncGithubActivityAction}
        />
      ) : null}

      {latestStage ? (
        <Card className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Evaluations</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Synthese du cycle d evaluation</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Suivez les evaluations planifiees, leur score courant et leur statut de validation sur ce stage.
              </p>
            </div>

            <Link
              href={`/evaluations/nouvelle?stageId=${latestStage.id}&type=DEBUT_STAGE`}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Planifier une evaluation
            </Link>
          </div>

          {latestStage.evaluations.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-3">
              {latestStage.evaluations.map((evaluation) => (
                <Link
                  key={evaluation.id}
                  href={`/evaluations/${evaluation.id}`}
                  className="block rounded-[22px] border border-border bg-background p-4 transition hover:border-primary/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <StatusBadge status={getEvaluationStatusLabel(evaluation.status)} />
                      <p className="text-base font-semibold">{getEvaluationTypeLabel(evaluation.type)}</p>
                      <p className="text-sm text-muted">
                        Score {evaluation.totalScore}/{evaluation.maxScore}
                      </p>
                    </div>
                    <div className="text-sm text-muted sm:text-right">
                      <p>{formatDate(evaluation.scheduledFor)}</p>
                      <p>Maj {formatDate(evaluation.updatedAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune evaluation planifiee"
              description="Planifiez une evaluation de debut, mi-parcours ou fin de stage pour structurer le suivi."
              actionHref={`/evaluations/nouvelle?stageId=${latestStage.id}&type=DEBUT_STAGE`}
              actionLabel="Creer la premiere evaluation"
            />
          )}
        </Card>
      ) : null}

      {latestStage ? (
        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="space-y-5">
            <div>
              <p className="text-sm font-medium text-primary">Rapports</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Derniers rapports du stage</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Les derniers rapports restent accessibles ici pour suivre l avancement et les
                retours d encadrement sans quitter la fiche.
              </p>
            </div>

            {latestStage.rapports.length > 0 ? (
              <div className="space-y-4">
                {latestStage.rapports.map((rapport) => (
                  <Link
                    key={rapport.id}
                    href={`/rapports/${rapport.id}`}
                    className="block rounded-[22px] border border-border bg-background p-4 transition hover:border-primary/40"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={getRapportStatusLabel(rapport.statut)} />
                          <span className="text-xs uppercase tracking-[0.18em] text-muted">
                            Semaine {rapport.semaine}
                          </span>
                        </div>
                        <p className="text-sm leading-6 text-muted">{rapport.tachesRealisees}</p>
                      </div>
                      <div className="text-sm text-muted sm:text-right">
                        <p className="font-medium text-foreground">{rapport.avancement}%</p>
                        <p>Maj {formatDate(rapport.updatedAt)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Aucun rapport disponible"
                description="Les rapports associes au stage apparaitront ici des leur creation."
                actionHref="/rapports"
                actionLabel="Voir les rapports"
              />
            )}
          </Card>

          <div className="grid gap-4">
            <Card className="space-y-5">
              <div>
                <p className="text-sm font-medium text-primary">Documents</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Pieces associees</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Consultez rapidement les documents attaches au stage et leur statut de traitement.
                </p>
              </div>

              {latestStage.documents.length > 0 ? (
                <div className="space-y-3">
                  {latestStage.documents.map((document) => (
                    <Link
                      key={document.id}
                      href={`/documents/${document.id}`}
                      className="block rounded-[22px] border border-border bg-background p-4 transition hover:border-primary/40"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{document.nom}</p>
                          <p className="text-sm text-muted">
                            {getDocumentTypeLabel(document.type)} · {formatDocumentSize(document.tailleOctets)} · Version{" "}
                            {document.version}
                          </p>
                          <p className="text-xs text-muted">
                            Ajoute par {`${document.auteur.prenom} ${document.auteur.nom}`.trim()} le{" "}
                            {formatDate(document.createdAt)}
                          </p>
                        </div>

                        <div className="flex flex-col items-start gap-3 sm:items-end">
                          <StatusBadge status={getDocumentStatusLabel(document.statut)} />
                          <span className="text-sm font-semibold text-primary">Ouvrir le document</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Aucun document sur ce stage"
                  description="Le CV, la convention et les autres pieces versees sur le stage seront visibles ici."
                />
              )}
            </Card>

            {session?.user && (session.user.role === "ADMIN" || session.user.role === "RH") ? (
              <DocumentUploadForm stageId={latestStage.id} action={uploadDocumentAction} />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
