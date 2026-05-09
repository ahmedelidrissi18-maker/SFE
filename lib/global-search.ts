import type { Prisma, Role } from "@prisma/client";
import { getDocumentStatusLabel, getDocumentTypeLabel } from "@/lib/documents";
import { getEvaluationStatusLabel, getEvaluationTypeLabel } from "@/lib/evaluations";
import { prisma } from "@/lib/prisma";
import { getRapportStatusLabel } from "@/lib/rapports";
import { getStageStatusLabel } from "@/lib/stages";

const MIN_GLOBAL_SEARCH_QUERY_LENGTH = 2;
const DEFAULT_SECTION_LIMIT = 6;

export type GlobalSearchItem = {
  id: string;
  kind: "stagiaire" | "stage" | "rapport" | "document" | "evaluation";
  title: string;
  description: string;
  href: string;
  status?: string;
  meta?: string;
};

export type GlobalSearchSection = {
  key: GlobalSearchItem["kind"];
  label: string;
  items: GlobalSearchItem[];
};

export function normalizeGlobalSearchQuery(query: string | null | undefined) {
  return (query ?? "").trim().replace(/\s+/g, " ");
}

function buildInsensitiveContains(value: string) {
  return {
    contains: value,
    mode: "insensitive" as const,
  };
}

function canSearchStagiaires(role: Role) {
  return role === "ADMIN" || role === "RH";
}

function canSearchStages(role: Role) {
  return role === "ADMIN" || role === "RH" || role === "ENCADRANT";
}

function getStageVisibilityFilter(role: Role, userId: string): Prisma.StageWhereInput {
  if (role === "ENCADRANT") {
    return {
      encadrantId: userId,
    };
  }

  if (role === "STAGIAIRE") {
    return {
      stagiaire: {
        userId,
      },
    };
  }

  return {};
}

function getStagiaireVisibilityFilter(role: Role, userId: string): Prisma.StagiaireWhereInput {
  if (role === "ENCADRANT") {
    return {
      stages: {
        some: {
          encadrantId: userId,
        },
      },
    };
  }

  if (role === "STAGIAIRE") {
    return {
      userId,
    };
  }

  return {};
}

function buildStageDetailHref(input: {
  role: Role;
  stageId: string;
  stagiaireId: string;
}) {
  if (input.role === "ADMIN" || input.role === "RH") {
    return `/stagiaires/${input.stagiaireId}`;
  }

  return `/stages?highlight=${input.stageId}`;
}

function buildSnippet(value: string | null | undefined, maxLength = 140) {
  const normalizedValue = (value ?? "").trim().replace(/\s+/g, " ");

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength - 3).trimEnd()}...`;
}

export async function searchGlobally(input: {
  query: string;
  role: Role;
  userId: string;
  limitPerSection?: number;
}) {
  const normalizedQuery = normalizeGlobalSearchQuery(input.query);
  const limitPerSection = input.limitPerSection ?? DEFAULT_SECTION_LIMIT;

  if (normalizedQuery.length < MIN_GLOBAL_SEARCH_QUERY_LENGTH) {
    return {
      query: normalizedQuery,
      sections: [] as GlobalSearchSection[],
    };
  }

  const stageVisibilityFilter = getStageVisibilityFilter(input.role, input.userId);
  const stagiaireVisibilityFilter = getStagiaireVisibilityFilter(input.role, input.userId);

  const [stagiaires, stages, rapports, documents, evaluations] = await Promise.all([
    canSearchStagiaires(input.role)
      ? prisma.stagiaire.findMany({
          where: {
            AND: [
              stagiaireVisibilityFilter,
              {
                OR: [
                  { cin: buildInsensitiveContains(normalizedQuery) },
                  { etablissement: buildInsensitiveContains(normalizedQuery) },
                  { specialite: buildInsensitiveContains(normalizedQuery) },
                  { niveau: buildInsensitiveContains(normalizedQuery) },
                  { annee: buildInsensitiveContains(normalizedQuery) },
                  { user: { nom: buildInsensitiveContains(normalizedQuery) } },
                  { user: { prenom: buildInsensitiveContains(normalizedQuery) } },
                  { user: { email: buildInsensitiveContains(normalizedQuery) } },
                ],
              },
            ],
          },
          include: {
            user: true,
            stages: {
              orderBy: [{ dateDebut: "desc" }],
              take: 1,
              select: {
                id: true,
                departement: true,
                sujet: true,
              },
            },
          },
          orderBy: [
            {
              user: {
                nom: "asc",
              },
            },
          ],
          take: limitPerSection,
        })
      : Promise.resolve([]),
    canSearchStages(input.role)
      ? prisma.stage.findMany({
          where: {
            AND: [
              stageVisibilityFilter,
              {
                OR: [
                  { sujet: buildInsensitiveContains(normalizedQuery) },
                  { departement: buildInsensitiveContains(normalizedQuery) },
                  { githubRepo: buildInsensitiveContains(normalizedQuery) },
                  { stagiaire: { cin: buildInsensitiveContains(normalizedQuery) } },
                  { stagiaire: { user: { nom: buildInsensitiveContains(normalizedQuery) } } },
                  { stagiaire: { user: { prenom: buildInsensitiveContains(normalizedQuery) } } },
                  { encadrant: { nom: buildInsensitiveContains(normalizedQuery) } },
                  { encadrant: { prenom: buildInsensitiveContains(normalizedQuery) } },
                ],
              },
            ],
          },
          include: {
            stagiaire: {
              include: {
                user: true,
              },
            },
            encadrant: true,
          },
          orderBy: [{ updatedAt: "desc" }],
          take: limitPerSection,
        })
      : Promise.resolve([]),
    prisma.rapport.findMany({
      where: {
        AND: [
          {
            stage: stageVisibilityFilter,
          },
          {
            OR: [
              { tachesRealisees: buildInsensitiveContains(normalizedQuery) },
              { difficultes: buildInsensitiveContains(normalizedQuery) },
              { planSuivant: buildInsensitiveContains(normalizedQuery) },
              { commentaireEncadrant: buildInsensitiveContains(normalizedQuery) },
              { stage: { sujet: buildInsensitiveContains(normalizedQuery) } },
              { stage: { stagiaire: { user: { nom: buildInsensitiveContains(normalizedQuery) } } } },
              { stage: { stagiaire: { user: { prenom: buildInsensitiveContains(normalizedQuery) } } } },
            ],
          },
        ],
      },
      include: {
        stage: {
          include: {
            stagiaire: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: limitPerSection,
    }),
    prisma.document.findMany({
      where: {
        AND: [
          { isDeleted: false },
          {
            stage: stageVisibilityFilter,
          },
          {
            OR: [
              { nom: buildInsensitiveContains(normalizedQuery) },
              { rejectionReason: buildInsensitiveContains(normalizedQuery) },
              { stage: { sujet: buildInsensitiveContains(normalizedQuery) } },
              { stage: { departement: buildInsensitiveContains(normalizedQuery) } },
              { stage: { stagiaire: { user: { nom: buildInsensitiveContains(normalizedQuery) } } } },
              { stage: { stagiaire: { user: { prenom: buildInsensitiveContains(normalizedQuery) } } } },
            ],
          },
        ],
      },
      include: {
        stage: {
          include: {
            stagiaire: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: limitPerSection,
    }),
    prisma.evaluation.findMany({
      where: {
        AND: [
          {
            stage: stageVisibilityFilter,
          },
          {
            OR: [
              { commentaire: buildInsensitiveContains(normalizedQuery) },
              { commentaireEncadrant: buildInsensitiveContains(normalizedQuery) },
              { commentaireRh: buildInsensitiveContains(normalizedQuery) },
              { stage: { sujet: buildInsensitiveContains(normalizedQuery) } },
              { stage: { departement: buildInsensitiveContains(normalizedQuery) } },
              { stage: { stagiaire: { user: { nom: buildInsensitiveContains(normalizedQuery) } } } },
              { stage: { stagiaire: { user: { prenom: buildInsensitiveContains(normalizedQuery) } } } },
            ],
          },
        ],
      },
      include: {
        stage: {
          include: {
            stagiaire: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: limitPerSection * 2,
    }),
  ]);

  const lowercaseQuery = normalizedQuery.toLowerCase();

  const sections: GlobalSearchSection[] = [
    {
      key: "stagiaire",
      label: "Stagiaires",
      items: stagiaires.map((stagiaire) => {
        const latestStage = stagiaire.stages[0];

        return {
          id: stagiaire.id,
          kind: "stagiaire",
          title: `${stagiaire.user.prenom} ${stagiaire.user.nom}`.trim(),
          description: [stagiaire.user.email, stagiaire.cin].filter(Boolean).join(" - "),
          href: `/stagiaires/${stagiaire.id}`,
          meta: latestStage
            ? `${latestStage.departement} - ${buildSnippet(latestStage.sujet, 64)}`
            : "Aucun stage rattache",
        } satisfies GlobalSearchItem;
      }),
    } satisfies GlobalSearchSection,
    {
      key: "stage",
      label: "Stages",
      items: stages.map((stage) => ({
        id: stage.id,
        kind: "stage",
        title: buildSnippet(stage.sujet, 90),
        description: `${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom}`.trim(),
        href: buildStageDetailHref({
          role: input.role,
          stageId: stage.id,
          stagiaireId: stage.stagiaireId,
        }),
        status: getStageStatusLabel(stage.statut),
        meta: [stage.departement, stage.encadrant ? `${stage.encadrant.prenom} ${stage.encadrant.nom}`.trim() : "Sans encadrant"]
          .filter(Boolean)
          .join(" - "),
      })),
    } satisfies GlobalSearchSection,
    {
      key: "rapport",
      label: "Rapports",
      items: rapports.map((rapport) => ({
        id: rapport.id,
        kind: "rapport",
        title: `Rapport semaine ${rapport.semaine} - ${`${rapport.stage.stagiaire.user.prenom} ${rapport.stage.stagiaire.user.nom}`.trim()}`,
        description: buildSnippet(
          rapport.tachesRealisees ||
            rapport.planSuivant ||
            rapport.difficultes ||
            rapport.commentaireEncadrant ||
            rapport.stage.sujet,
        ),
        href: `/rapports/${rapport.id}`,
        status: getRapportStatusLabel(rapport.statut),
        meta: buildSnippet(rapport.stage.sujet, 80),
      })),
    } satisfies GlobalSearchSection,
    {
      key: "document",
      label: "Documents",
      items: documents.map((document) => ({
        id: document.id,
        kind: "document",
        title: document.nom,
        description: `${document.stage.stagiaire.user.prenom} ${document.stage.stagiaire.user.nom}`.trim(),
        href: `/documents/${document.id}`,
        status: getDocumentStatusLabel(document.statut),
        meta: `${getDocumentTypeLabel(document.type)} - ${buildSnippet(document.stage.sujet, 72)}`,
      })),
    } satisfies GlobalSearchSection,
    {
      key: "evaluation",
      label: "Evaluations",
      items: evaluations
        .filter((evaluation) => {
          const typeLabel = getEvaluationTypeLabel(evaluation.type).toLowerCase();
          const statusLabel = getEvaluationStatusLabel(evaluation.status).toLowerCase();

          return (
            typeLabel.includes(lowercaseQuery) ||
            statusLabel.includes(lowercaseQuery) ||
            Boolean(evaluation.commentaire?.toLowerCase().includes(lowercaseQuery)) ||
            Boolean(evaluation.commentaireEncadrant?.toLowerCase().includes(lowercaseQuery)) ||
            Boolean(evaluation.commentaireRh?.toLowerCase().includes(lowercaseQuery)) ||
            `${evaluation.stage.stagiaire.user.prenom} ${evaluation.stage.stagiaire.user.nom}`
              .toLowerCase()
              .includes(lowercaseQuery) ||
            evaluation.stage.sujet.toLowerCase().includes(lowercaseQuery)
          );
        })
        .slice(0, limitPerSection)
        .map((evaluation) => ({
          id: evaluation.id,
          kind: "evaluation",
          title: `${getEvaluationTypeLabel(evaluation.type)} - ${`${evaluation.stage.stagiaire.user.prenom} ${evaluation.stage.stagiaire.user.nom}`.trim()}`,
          description: buildSnippet(
            evaluation.commentaire ||
              evaluation.commentaireEncadrant ||
              evaluation.commentaireRh ||
              evaluation.stage.sujet,
          ),
          href: `/evaluations/${evaluation.id}`,
          status: getEvaluationStatusLabel(evaluation.status),
          meta: buildSnippet(evaluation.stage.sujet, 80),
        })),
    } satisfies GlobalSearchSection,
  ].filter((section) => section.items.length > 0);

  return {
    query: normalizedQuery,
    sections,
  };
}
