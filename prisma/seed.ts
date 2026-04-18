import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import {
  DocumentType,
  EvaluationRevisionAction,
  EvaluationStatus,
  EvaluationType,
  PrismaClient,
  RapportStatus,
  Role,
  StageStatus,
} from "@prisma/client";
import { DEFAULT_USER_PASSWORD } from "@/lib/app-config";
import { getDocumentStorageRoot } from "@/lib/documents";
import { calculateEvaluationScore, getEvaluationGridDefinition } from "@/lib/evaluations";

const prisma = new PrismaClient();

const dayInMs = 24 * 60 * 60 * 1000;

function shiftDays(referenceDate: Date, days: number) {
  return new Date(referenceDate.getTime() + days * dayInMs);
}

function atMidday(date: Date) {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  return next;
}

function buildDocumentContent(title: string, lines: string[]) {
  return [
    title,
    "",
    ...lines,
    "",
    "Document genere par le seed V1 Gestion des Stagiaires.",
  ].join("\n");
}

function buildEvaluationPayload(
  type: EvaluationType,
  values: Record<string, { score: number; comment?: string }>,
) {
  const grid = getEvaluationGridDefinition(type);
  const rawNotes = grid.criteria.map((criterion) => ({
    criterionId: criterion.id,
    score: values[criterion.id]?.score ?? 0,
    comment: values[criterion.id]?.comment ?? "",
  }));
  const scoreSummary = calculateEvaluationScore(grid.criteria, rawNotes);

  return {
    gridVersion: grid.version,
    criteriaSnapshot: grid.criteria,
    notes: scoreSummary.notes,
    totalScore: scoreSummary.totalScore,
    maxScore: scoreSummary.maxScore,
  };
}

type UserSeed = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  isActive?: boolean;
};

type StagiaireSeed = {
  id: string;
  userId: string;
  cin: string;
  telephone: string;
  dateNaissance: Date;
  etablissement: string;
  specialite: string;
  niveau: string;
  annee: string;
  photoUrl: string;
};

type StageSeed = {
  id: string;
  stagiaireId: string;
  encadrantId: string;
  dateDebut: Date;
  dateFin: Date;
  departement: string;
  sujet: string;
  githubRepo?: string;
  statut: StageStatus;
  createdAt: Date;
  updatedAt: Date;
};

type ReportPattern = {
  stageId: string;
  stagiaireName: string;
  topic: string;
  statuses: RapportStatus[];
  comments: Array<string | null>;
  progresses: number[];
  stageStartDate: Date;
};

async function resetStorage() {
  const storageRoot = getDocumentStorageRoot();
  await rm(storageRoot, { recursive: true, force: true });
  await mkdir(storageRoot, { recursive: true });
}

async function main() {
  const now = atMidday(new Date());
  const passwordHash = await bcrypt.hash(DEFAULT_USER_PASSWORD, 10);

  const users: UserSeed[] = [
    {
      id: "user-admin-1",
      prenom: "Nadia",
      nom: "Berrada",
      email: "admin@stagiaires.local",
      role: Role.ADMIN,
    },
    {
      id: "user-admin-2",
      prenom: "Samir",
      nom: "El Mansouri",
      email: "admin2@stagiaires.local",
      role: Role.ADMIN,
    },
    {
      id: "user-rh-1",
      prenom: "Salma",
      nom: "Alaoui",
      email: "rh1@stagiaires.local",
      role: Role.RH,
    },
    {
      id: "user-rh-2",
      prenom: "Imane",
      nom: "Mouline",
      email: "rh2@stagiaires.local",
      role: Role.RH,
    },
    {
      id: "user-enc-1",
      prenom: "Karim",
      nom: "Bennani",
      email: "encadrant1@stagiaires.local",
      role: Role.ENCADRANT,
    },
    {
      id: "user-enc-2",
      prenom: "Souad",
      nom: "Amrani",
      email: "encadrant2@stagiaires.local",
      role: Role.ENCADRANT,
    },
    {
      id: "user-enc-3",
      prenom: "Youssef",
      nom: "Cherkaoui",
      email: "encadrant3@stagiaires.local",
      role: Role.ENCADRANT,
    },
    {
      id: "user-enc-4",
      prenom: "Meryem",
      nom: "Lahlou",
      email: "encadrant4@stagiaires.local",
      role: Role.ENCADRANT,
    },
    {
      id: "user-stg-1",
      prenom: "Amina",
      nom: "El Idrissi",
      email: "stagiaire1@stagiaires.local",
      role: Role.STAGIAIRE,
    },
    {
      id: "user-stg-2",
      prenom: "Yassine",
      nom: "Tazi",
      email: "stagiaire2@stagiaires.local",
      role: Role.STAGIAIRE,
    },
    {
      id: "user-stg-3",
      prenom: "Salim",
      nom: "Boukili",
      email: "stagiaire3@stagiaires.local",
      role: Role.STAGIAIRE,
    },
    {
      id: "user-stg-4",
      prenom: "Kenza",
      nom: "Ouazzani",
      email: "stagiaire4@stagiaires.local",
      role: Role.STAGIAIRE,
    },
    {
      id: "user-stg-5",
      prenom: "Rachid",
      nom: "Naciri",
      email: "stagiaire5@stagiaires.local",
      role: Role.STAGIAIRE,
    },
    {
      id: "user-stg-6",
      prenom: "Hajar",
      nom: "Ait Lahcen",
      email: "stagiaire6@stagiaires.local",
      role: Role.STAGIAIRE,
    },
    {
      id: "user-stg-7",
      prenom: "Omar",
      nom: "Skalli",
      email: "stagiaire7@stagiaires.local",
      role: Role.STAGIAIRE,
    },
    {
      id: "user-stg-8",
      prenom: "Sara",
      nom: "Bousfiha",
      email: "stagiaire8@stagiaires.local",
      role: Role.STAGIAIRE,
    },
  ];

  const stagiaires: StagiaireSeed[] = [
    {
      id: "stagiaire-1",
      userId: "user-stg-1",
      cin: "AA123401",
      telephone: "0610000001",
      dateNaissance: shiftDays(now, -9200),
      etablissement: "ENSA Rabat",
      specialite: "Genie logiciel",
      niveau: "Bac+5",
      annee: "2025-2026",
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "stagiaire-2",
      userId: "user-stg-2",
      cin: "AA123402",
      telephone: "0610000002",
      dateNaissance: shiftDays(now, -8900),
      etablissement: "EMI",
      specialite: "Systemes embarques",
      niveau: "Bac+5",
      annee: "2025-2026",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "stagiaire-3",
      userId: "user-stg-3",
      cin: "AA123403",
      telephone: "0610000003",
      dateNaissance: shiftDays(now, -8600),
      etablissement: "FST Settat",
      specialite: "Data engineering",
      niveau: "Master 2",
      annee: "2025-2026",
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "stagiaire-4",
      userId: "user-stg-4",
      cin: "AA123404",
      telephone: "0610000004",
      dateNaissance: shiftDays(now, -8800),
      etablissement: "ENSIAS",
      specialite: "Cloud computing",
      niveau: "Bac+5",
      annee: "2025-2026",
      photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "stagiaire-5",
      userId: "user-stg-5",
      cin: "AA123405",
      telephone: "0610000005",
      dateNaissance: shiftDays(now, -9100),
      etablissement: "ENSET Mohammedia",
      specialite: "Developpement full-stack",
      niveau: "Licence pro",
      annee: "2025-2026",
      photoUrl: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "stagiaire-6",
      userId: "user-stg-6",
      cin: "AA123406",
      telephone: "0610000006",
      dateNaissance: shiftDays(now, -8450),
      etablissement: "Faculte des Sciences",
      specialite: "Business intelligence",
      niveau: "Master 2",
      annee: "2025-2026",
      photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "stagiaire-7",
      userId: "user-stg-7",
      cin: "AA123407",
      telephone: "0610000007",
      dateNaissance: shiftDays(now, -9000),
      etablissement: "EST Casablanca",
      specialite: "Administration systeme",
      niveau: "DUT",
      annee: "2025-2026",
      photoUrl: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "stagiaire-8",
      userId: "user-stg-8",
      cin: "AA123408",
      telephone: "0610000008",
      dateNaissance: shiftDays(now, -8700),
      etablissement: "INPT",
      specialite: "Cybersecurite",
      niveau: "Bac+5",
      annee: "2025-2026",
      photoUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80",
    },
  ];

  const stages: StageSeed[] = [
    {
      id: "stage-1-current",
      stagiaireId: "stagiaire-1",
      encadrantId: "user-enc-1",
      dateDebut: shiftDays(now, -30),
      dateFin: shiftDays(now, 12),
      departement: "Transformation digitale",
      sujet: "Refonte du portail de suivi des stages",
      githubRepo: "https://github.com/example/sfe-portal",
      statut: StageStatus.EN_COURS,
      createdAt: shiftDays(now, -36),
      updatedAt: shiftDays(now, -1),
    },
    {
      id: "stage-2-current",
      stagiaireId: "stagiaire-2",
      encadrantId: "user-enc-2",
      dateDebut: shiftDays(now, -45),
      dateFin: shiftDays(now, 45),
      departement: "Infrastructure",
      sujet: "Automatisation du provisionnement des environnements",
      githubRepo: "https://github.com/example/sfe-infra",
      statut: StageStatus.EN_COURS,
      createdAt: shiftDays(now, -52),
      updatedAt: shiftDays(now, -2),
    },
    {
      id: "stage-3-archive",
      stagiaireId: "stagiaire-3",
      encadrantId: "user-enc-3",
      dateDebut: shiftDays(now, -140),
      dateFin: shiftDays(now, -50),
      departement: "Data platform",
      sujet: "Industrialisation des pipelines de qualite des donnees",
      githubRepo: "https://github.com/example/sfe-data-platform",
      statut: StageStatus.TERMINE,
      createdAt: shiftDays(now, -147),
      updatedAt: shiftDays(now, -45),
    },
    {
      id: "stage-3-next",
      stagiaireId: "stagiaire-3",
      encadrantId: "user-enc-3",
      dateDebut: shiftDays(now, 25),
      dateFin: shiftDays(now, 110),
      departement: "Data platform",
      sujet: "Mise en place d un catalogue de donnees interne",
      githubRepo: "https://github.com/example/sfe-data-catalog",
      statut: StageStatus.PLANIFIE,
      createdAt: shiftDays(now, -4),
      updatedAt: shiftDays(now, -2),
    },
    {
      id: "stage-4-archive",
      stagiaireId: "stagiaire-4",
      encadrantId: "user-enc-4",
      dateDebut: shiftDays(now, -220),
      dateFin: shiftDays(now, -130),
      departement: "Cloud & DevOps",
      sujet: "Observabilite et supervision multi-environnements",
      githubRepo: "https://github.com/example/sfe-observability",
      statut: StageStatus.TERMINE,
      createdAt: shiftDays(now, -228),
      updatedAt: shiftDays(now, -125),
    },
    {
      id: "stage-4-next",
      stagiaireId: "stagiaire-4",
      encadrantId: "user-enc-1",
      dateDebut: shiftDays(now, 50),
      dateFin: shiftDays(now, 140),
      departement: "Cloud & DevOps",
      sujet: "Standardisation des pipelines CI/CD produits",
      githubRepo: "https://github.com/example/sfe-cicd",
      statut: StageStatus.PLANIFIE,
      createdAt: shiftDays(now, -3),
      updatedAt: shiftDays(now, -1),
    },
    {
      id: "stage-5-finished",
      stagiaireId: "stagiaire-5",
      encadrantId: "user-enc-2",
      dateDebut: shiftDays(now, -120),
      dateFin: shiftDays(now, -20),
      departement: "Applications metier",
      sujet: "Modernisation du module de demandes internes",
      githubRepo: "https://github.com/example/sfe-business-apps",
      statut: StageStatus.TERMINE,
      createdAt: shiftDays(now, -128),
      updatedAt: shiftDays(now, -18),
    },
    {
      id: "stage-6-finished",
      stagiaireId: "stagiaire-6",
      encadrantId: "user-enc-3",
      dateDebut: shiftDays(now, -210),
      dateFin: shiftDays(now, -80),
      departement: "Pilotage & BI",
      sujet: "Tableau de bord RH et suivi des indicateurs de performance",
      githubRepo: "https://github.com/example/sfe-bi",
      statut: StageStatus.TERMINE,
      createdAt: shiftDays(now, -218),
      updatedAt: shiftDays(now, -75),
    },
    {
      id: "stage-7-archive",
      stagiaireId: "stagiaire-7",
      encadrantId: "user-enc-4",
      dateDebut: shiftDays(now, -260),
      dateFin: shiftDays(now, -170),
      departement: "Operations IT",
      sujet: "Mise a niveau de l inventaire technique interne",
      githubRepo: "https://github.com/example/sfe-ops",
      statut: StageStatus.TERMINE,
      createdAt: shiftDays(now, -268),
      updatedAt: shiftDays(now, -165),
    },
    {
      id: "stage-7-cancelled",
      stagiaireId: "stagiaire-7",
      encadrantId: "user-enc-2",
      dateDebut: shiftDays(now, 10),
      dateFin: shiftDays(now, 70),
      departement: "Operations IT",
      sujet: "Reorganisation du parc et des procedures de support",
      githubRepo: "https://github.com/example/sfe-support",
      statut: StageStatus.ANNULE,
      createdAt: shiftDays(now, -6),
      updatedAt: shiftDays(now, -2),
    },
    {
      id: "stage-8-suspended",
      stagiaireId: "stagiaire-8",
      encadrantId: "user-enc-1",
      dateDebut: shiftDays(now, -25),
      dateFin: shiftDays(now, 8),
      departement: "Cyberdefense",
      sujet: "Durcissement des acces et revue des journaux de securite",
      githubRepo: "https://github.com/example/sfe-security",
      statut: StageStatus.SUSPENDU,
      createdAt: shiftDays(now, -30),
      updatedAt: shiftDays(now, -1),
    },
  ];

  const reportPatterns: ReportPattern[] = [
    {
      stageId: "stage-1-current",
      stagiaireName: "Amina El Idrissi",
      topic: "portail de suivi",
      statuses: [RapportStatus.VALIDE, RapportStatus.RETOURNE, RapportStatus.SOUMIS],
      comments: [
        "Tres bonne progression sur la structuration du backlog et des pages principales.",
        "Merci de detailler davantage les impacts front-end et les tests prevus.",
        null,
      ],
      progresses: [25, 48, 72],
      stageStartDate: shiftDays(now, -30),
    },
    {
      stageId: "stage-2-current",
      stagiaireName: "Yassine Tazi",
      topic: "provisionnement automatisé",
      statuses: [RapportStatus.VALIDE, RapportStatus.VALIDE, RapportStatus.SOUMIS],
      comments: [
        "Les premiers scripts Terraform sont propres et reutilisables.",
        "Le lot de supervision est pertinent, poursuivez sur l industrialisation.",
        null,
      ],
      progresses: [20, 42, 65],
      stageStartDate: shiftDays(now, -45),
    },
    {
      stageId: "stage-3-archive",
      stagiaireName: "Salim Boukili",
      topic: "qualite des donnees",
      statuses: [RapportStatus.VALIDE, RapportStatus.VALIDE, RapportStatus.VALIDE],
      comments: [
        "Les regles de qualification sont bien formulees et documentees.",
        "Le pipeline de reconciliation est stable et exploitable.",
        "Cloture de stage satisfaisante avec livrables complets.",
      ],
      progresses: [30, 60, 100],
      stageStartDate: shiftDays(now, -140),
    },
    {
      stageId: "stage-4-archive",
      stagiaireName: "Kenza Ouazzani",
      topic: "observabilite",
      statuses: [RapportStatus.VALIDE, RapportStatus.RETOURNE, RapportStatus.VALIDE],
      comments: [
        "La cartographie des incidents est claire et bien priorisee.",
        "Le rapport doit mieux distinguer alertes systeme et alertes applicatives.",
        "Le stage est boucle avec un runbook de qualite.",
      ],
      progresses: [28, 56, 100],
      stageStartDate: shiftDays(now, -220),
    },
    {
      stageId: "stage-5-finished",
      stagiaireName: "Rachid Naciri",
      topic: "applications metier",
      statuses: [RapportStatus.VALIDE, RapportStatus.VALIDE, RapportStatus.VALIDE],
      comments: [
        "Le cadrage des besoins metier a ete bien mene.",
        "Les parcours critiques sont fluides et bien relies aux donnees.",
        "Livraison finale conforme aux attentes du departement.",
      ],
      progresses: [35, 68, 100],
      stageStartDate: shiftDays(now, -120),
    },
    {
      stageId: "stage-6-finished",
      stagiaireName: "Hajar Ait Lahcen",
      topic: "reporting RH",
      statuses: [RapportStatus.VALIDE, RapportStatus.VALIDE, RapportStatus.VALIDE],
      comments: [
        "Bonne base analytique sur les indicateurs de performance.",
        "Les visualisations sont lisibles et directement exploitables.",
        "Cloture positive avec documentation soignee.",
      ],
      progresses: [32, 66, 100],
      stageStartDate: shiftDays(now, -210),
    },
    {
      stageId: "stage-7-archive",
      stagiaireName: "Omar Skalli",
      topic: "inventaire technique",
      statuses: [RapportStatus.VALIDE, RapportStatus.RETOURNE, RapportStatus.VALIDE],
      comments: [
        "Bon demarrage et perimetre bien compris.",
        "Merci de mieux tracer les ecarts entre l inventaire cible et l inventaire reel.",
        "Synthese finale claire et actionnable.",
      ],
      progresses: [26, 54, 100],
      stageStartDate: shiftDays(now, -260),
    },
    {
      stageId: "stage-8-suspended",
      stagiaireName: "Sara Bousfiha",
      topic: "durcissement des acces",
      statuses: [RapportStatus.VALIDE, RapportStatus.RETOURNE, RapportStatus.BROUILLON],
      comments: [
        "La premiere analyse de risque est solide.",
        "Merci d ajouter les preuves techniques des controles appliques.",
        null,
      ],
      progresses: [22, 40, 52],
      stageStartDate: shiftDays(now, -25),
    },
  ];

  const rapports = reportPatterns.flatMap((pattern) =>
    pattern.statuses.map((status, index) => {
      const week = index + 1;
      const draft = status === RapportStatus.BROUILLON;
      const createdAt = shiftDays(pattern.stageStartDate, week * 7 - 4);
      const dateSoumission = draft ? null : shiftDays(pattern.stageStartDate, week * 7 - 1);
      const updatedAt = draft
        ? shiftDays(pattern.stageStartDate, week * 7 - 2)
        : shiftDays(pattern.stageStartDate, week * 7);

      return {
        id: `rapport-${pattern.stageId}-${week}`,
        stageId: pattern.stageId,
        semaine: week,
        tachesRealisees: `Travaux semaine ${week} sur ${pattern.topic} pour ${pattern.stagiaireName}. Consolidation du livrable principal, synchronisation avec l encadrant et mise a jour des ecrans relies au sujet.`,
        difficultes:
          index === 1
            ? "Arbitrer les priorites fonctionnelles et clarifier quelques dependances techniques."
            : index === 2 && draft
              ? "Formaliser la suite apres suspension temporaire du stage."
              : "Aucune difficulte bloquante, seulement des ajustements de perimetre.",
        planSuivant:
          status === RapportStatus.BROUILLON
            ? "Preparer la reprise et finaliser les points restants du rapport avant soumission."
            : week === 3
              ? "Stabiliser la livraison et capitaliser sur les retours du metier."
              : "Poursuivre l implementation et documenter les decisions techniques.",
        avancement: pattern.progresses[index],
        statut: status,
        commentaireEncadrant: pattern.comments[index],
        dateSoumission,
        createdAt,
        updatedAt,
      };
    }),
  );

  const latestStageByStagiaireId = new Map<string, StageSeed>();
  for (const stage of stages) {
    const current = latestStageByStagiaireId.get(stage.stagiaireId);
    if (!current || current.createdAt < stage.createdAt) {
      latestStageByStagiaireId.set(stage.stagiaireId, stage);
    }
  }

  const rhAuthors = ["user-rh-1", "user-rh-2"];
  const documents = Array.from(latestStageByStagiaireId.values()).flatMap((stage, index) => {
    const stagiaire = stagiaires.find((item) => item.id === stage.stagiaireId);
    const user = users.find((item) => item.id === stagiaire?.userId);
    const authorId = rhAuthors[index % rhAuthors.length];
    const commonDate = shiftDays(stage.createdAt, 2);

    if (!stagiaire || !user) {
      return [];
    }

    return [
      {
        id: `document-${stage.id}-cv`,
        stageId: stage.id,
        auteurId: authorId,
        type: DocumentType.CV,
        nom: `CV_${user.prenom}_${user.nom}.pdf`,
        url: path.join(getDocumentStorageRoot(), stage.id, `cv-${stage.id}.pdf`),
        tailleOctets: 0,
        version: 1,
        isDeleted: false,
        createdAt: commonDate,
        updatedAt: commonDate,
        content: buildDocumentContent(`CV - ${user.prenom} ${user.nom}`, [
          `Etablissement : ${stagiaire.etablissement}`,
          `Specialite : ${stagiaire.specialite}`,
          `Niveau : ${stagiaire.niveau}`,
          `Telephone : ${stagiaire.telephone}`,
        ]),
      },
      {
        id: `document-${stage.id}-convention`,
        stageId: stage.id,
        auteurId: authorId,
        type: DocumentType.CONVENTION,
        nom: `Convention_${stage.id}.pdf`,
        url: path.join(getDocumentStorageRoot(), stage.id, `convention-${stage.id}.pdf`),
        tailleOctets: 0,
        version: 1,
        isDeleted: false,
        createdAt: shiftDays(commonDate, 1),
        updatedAt: shiftDays(commonDate, 1),
        content: buildDocumentContent(`Convention - ${user.prenom} ${user.nom}`, [
          `Sujet : ${stage.sujet}`,
          `Departement : ${stage.departement}`,
          `Periode : ${stage.dateDebut.toISOString().slice(0, 10)} au ${stage.dateFin.toISOString().slice(0, 10)}`,
          `Encadrant : ${users.find((item) => item.id === stage.encadrantId)?.prenom ?? ""} ${users.find((item) => item.id === stage.encadrantId)?.nom ?? ""}`.trim(),
        ]),
      },
    ];
  });

  const documentRows = documents.map((document) => ({
    id: document.id,
    stageId: document.stageId,
    auteurId: document.auteurId,
    type: document.type,
    nom: document.nom,
    url: document.url,
    tailleOctets: Buffer.byteLength(document.content),
    version: document.version,
    isDeleted: document.isDeleted,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  }));

  const evaluationDefinitions: Array<{
    id: string;
    stageId: string;
    type: EvaluationType;
    status: EvaluationStatus;
    commentaire: string;
    commentaireEncadrant: string;
    commentaireRh: string | null;
    scheduledFor: Date;
    createdByUserId: string;
    submittedByUserId: string;
    validatedByUserId: string | null;
    returnedByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
    submittedAt: Date | null;
    validatedAt: Date | null;
    returnedAt: Date | null;
    values: Record<string, { score: number; comment?: string }>;
  }> = [
    {
      id: "evaluation-stage-1-start",
      stageId: "stage-1-current",
      type: EvaluationType.DEBUT_STAGE,
      status: EvaluationStatus.VALIDE,
      commentaire: "Demarrage tres solide, objectifs compris et rythme bien lance.",
      commentaireEncadrant: "Bonne integration dans l equipe produit.",
      commentaireRh: "Validation RH sans reserve.",
      scheduledFor: shiftDays(now, -25),
      createdByUserId: "user-enc-1",
      submittedByUserId: "user-enc-1",
      validatedByUserId: "user-rh-1",
      returnedByUserId: null,
      createdAt: shiftDays(now, -27),
      updatedAt: shiftDays(now, -24),
      submittedAt: shiftDays(now, -26),
      validatedAt: shiftDays(now, -24),
      returnedAt: null,
      values: {
        integration: { score: 4, comment: "Integration rapide avec l equipe." },
        comprehension: { score: 5, comment: "Sujet bien reformule des la premiere semaine." },
        organisation: { score: 4, comment: "Bonne structure de travail." },
        initiative: { score: 4, comment: "Questions pertinentes et utiles." },
      },
    },
    {
      id: "evaluation-stage-1-mid",
      stageId: "stage-1-current",
      type: EvaluationType.MI_PARCOURS,
      status: EvaluationStatus.SOUMIS,
      commentaire: "Mi-parcours encourageant avec une progression technique visible.",
      commentaireEncadrant: "Continuer a consolider les tests et la documentation.",
      commentaireRh: null,
      scheduledFor: shiftDays(now, 3),
      createdByUserId: "user-enc-1",
      submittedByUserId: "user-enc-1",
      validatedByUserId: null,
      returnedByUserId: null,
      createdAt: shiftDays(now, -3),
      updatedAt: shiftDays(now, -1),
      submittedAt: shiftDays(now, -1),
      validatedAt: null,
      returnedAt: null,
      values: {
        "progression-technique": { score: 4, comment: "Bonne maitrise du front et des flux API." },
        "qualite-livrables": { score: 4, comment: "Livrables clairs et relus." },
        collaboration: { score: 5, comment: "Tres bonne communication avec le binome RH." },
        autonomie: { score: 4, comment: "Monte bien en autonomie." },
      },
    },
    {
      id: "evaluation-stage-5-final",
      stageId: "stage-5-finished",
      type: EvaluationType.FINAL,
      status: EvaluationStatus.VALIDE,
      commentaire: "Cloture tres positive avec livrables utiles au departement metier.",
      commentaireEncadrant: "Le stagiaire a livre un lot directement reutilisable.",
      commentaireRh: "Evaluation finale validee et archivee.",
      scheduledFor: shiftDays(now, -25),
      createdByUserId: "user-enc-2",
      submittedByUserId: "user-enc-2",
      validatedByUserId: "user-rh-2",
      returnedByUserId: null,
      createdAt: shiftDays(now, -28),
      updatedAt: shiftDays(now, -22),
      submittedAt: shiftDays(now, -24),
      validatedAt: shiftDays(now, -22),
      returnedAt: null,
      values: {
        objectifs: { score: 5, comment: "Objectifs totalement atteints." },
        impact: { score: 5, comment: "Impact direct sur le module metier." },
        professionnalisme: { score: 4, comment: "Bonne posture et bonne tenue des engagements." },
        projection: { score: 4, comment: "Bonne capacite de capitalisation." },
      },
    },
    {
      id: "evaluation-stage-8-mid",
      stageId: "stage-8-suspended",
      type: EvaluationType.MI_PARCOURS,
      status: EvaluationStatus.RETOURNE,
      commentaire: "Le fond est bon mais certaines preuves techniques restent a consolider.",
      commentaireEncadrant: "Ajouter les traces et captures des controles appliques.",
      commentaireRh: "Merci de preciser les evidences de securisation avant validation.",
      scheduledFor: shiftDays(now, -6),
      createdByUserId: "user-enc-1",
      submittedByUserId: "user-enc-1",
      validatedByUserId: null,
      returnedByUserId: "user-rh-1",
      createdAt: shiftDays(now, -10),
      updatedAt: shiftDays(now, -4),
      submittedAt: shiftDays(now, -7),
      validatedAt: null,
      returnedAt: shiftDays(now, -4),
      values: {
        "progression-technique": { score: 4, comment: "Sujet securite bien compris." },
        "qualite-livrables": { score: 3, comment: "Des precisions restent attendues." },
        collaboration: { score: 4, comment: "Echanges constructifs avec l equipe." },
        autonomie: { score: 3, comment: "Autonomie correcte mais preuves a completer." },
      },
    },
  ];

  const evaluations = evaluationDefinitions.map((definition) => {
    const payload = buildEvaluationPayload(definition.type, definition.values);

    return {
      id: definition.id,
      stageId: definition.stageId,
      type: definition.type,
      status: definition.status,
      gridVersion: payload.gridVersion,
      criteriaSnapshot: payload.criteriaSnapshot,
      notes: payload.notes,
      totalScore: payload.totalScore,
      maxScore: payload.maxScore,
      commentaire: definition.commentaire,
      commentaireEncadrant: definition.commentaireEncadrant,
      commentaireRh: definition.commentaireRh,
      scheduledFor: definition.scheduledFor,
      createdByUserId: definition.createdByUserId,
      submittedByUserId: definition.submittedByUserId,
      validatedByUserId: definition.validatedByUserId,
      returnedByUserId: definition.returnedByUserId,
      submittedAt: definition.submittedAt,
      validatedAt: definition.validatedAt,
      returnedAt: definition.returnedAt,
      createdAt: definition.createdAt,
      updatedAt: definition.updatedAt,
    };
  });

  const evaluationById = new Map(evaluations.map((evaluation) => [evaluation.id, evaluation]));
  const evaluationRevisions = [
    {
      id: "evaluation-revision-1",
      evaluationId: "evaluation-stage-1-start",
      action: EvaluationRevisionAction.CREATE,
      previousStatus: null,
      nextStatus: EvaluationStatus.BROUILLON,
      changedByUserId: "user-enc-1",
      createdAt: shiftDays(now, -27),
    },
    {
      id: "evaluation-revision-2",
      evaluationId: "evaluation-stage-1-start",
      action: EvaluationRevisionAction.SUBMIT,
      previousStatus: EvaluationStatus.BROUILLON,
      nextStatus: EvaluationStatus.SOUMIS,
      changedByUserId: "user-enc-1",
      createdAt: shiftDays(now, -26),
    },
    {
      id: "evaluation-revision-3",
      evaluationId: "evaluation-stage-1-start",
      action: EvaluationRevisionAction.VALIDATE,
      previousStatus: EvaluationStatus.SOUMIS,
      nextStatus: EvaluationStatus.VALIDE,
      changedByUserId: "user-rh-1",
      createdAt: shiftDays(now, -24),
    },
    {
      id: "evaluation-revision-4",
      evaluationId: "evaluation-stage-1-mid",
      action: EvaluationRevisionAction.CREATE,
      previousStatus: null,
      nextStatus: EvaluationStatus.BROUILLON,
      changedByUserId: "user-enc-1",
      createdAt: shiftDays(now, -3),
    },
    {
      id: "evaluation-revision-5",
      evaluationId: "evaluation-stage-1-mid",
      action: EvaluationRevisionAction.SUBMIT,
      previousStatus: EvaluationStatus.BROUILLON,
      nextStatus: EvaluationStatus.SOUMIS,
      changedByUserId: "user-enc-1",
      createdAt: shiftDays(now, -1),
    },
    {
      id: "evaluation-revision-6",
      evaluationId: "evaluation-stage-5-final",
      action: EvaluationRevisionAction.CREATE,
      previousStatus: null,
      nextStatus: EvaluationStatus.BROUILLON,
      changedByUserId: "user-enc-2",
      createdAt: shiftDays(now, -28),
    },
    {
      id: "evaluation-revision-7",
      evaluationId: "evaluation-stage-5-final",
      action: EvaluationRevisionAction.SUBMIT,
      previousStatus: EvaluationStatus.BROUILLON,
      nextStatus: EvaluationStatus.SOUMIS,
      changedByUserId: "user-enc-2",
      createdAt: shiftDays(now, -24),
    },
    {
      id: "evaluation-revision-8",
      evaluationId: "evaluation-stage-5-final",
      action: EvaluationRevisionAction.VALIDATE,
      previousStatus: EvaluationStatus.SOUMIS,
      nextStatus: EvaluationStatus.VALIDE,
      changedByUserId: "user-rh-2",
      createdAt: shiftDays(now, -22),
    },
    {
      id: "evaluation-revision-9",
      evaluationId: "evaluation-stage-8-mid",
      action: EvaluationRevisionAction.CREATE,
      previousStatus: null,
      nextStatus: EvaluationStatus.BROUILLON,
      changedByUserId: "user-enc-1",
      createdAt: shiftDays(now, -10),
    },
    {
      id: "evaluation-revision-10",
      evaluationId: "evaluation-stage-8-mid",
      action: EvaluationRevisionAction.SUBMIT,
      previousStatus: EvaluationStatus.BROUILLON,
      nextStatus: EvaluationStatus.SOUMIS,
      changedByUserId: "user-enc-1",
      createdAt: shiftDays(now, -7),
    },
    {
      id: "evaluation-revision-11",
      evaluationId: "evaluation-stage-8-mid",
      action: EvaluationRevisionAction.RETURN,
      previousStatus: EvaluationStatus.SOUMIS,
      nextStatus: EvaluationStatus.RETOURNE,
      changedByUserId: "user-rh-1",
      createdAt: shiftDays(now, -4),
    },
  ].map((revision) => {
    const evaluation = evaluationById.get(revision.evaluationId);

    return {
      ...revision,
      previousNotes: evaluation?.notes ?? [],
      nextNotes: evaluation?.notes ?? [],
      previousScore: evaluation?.totalScore ?? 0,
      nextScore: evaluation?.totalScore ?? 0,
      commentSnapshot: {
        commentaire: evaluation?.commentaire ?? null,
        commentaireEncadrant: evaluation?.commentaireEncadrant ?? null,
        commentaireRh: evaluation?.commentaireRh ?? null,
      },
    };
  });

  const notifications = [
    {
      id: "notification-1",
      destinataireId: "user-admin-1",
      type: "STAGIAIRE_CREATED",
      titre: "Nouveau lot de stagiaires",
      message: "Huit stagiaires ont ete prepares pour la recette V1.",
      lien: "/stagiaires",
      isRead: false,
      createdAt: shiftDays(now, -1),
    },
    {
      id: "notification-2",
      destinataireId: "user-rh-1",
      type: "STAGE_ENDING_SOON",
      titre: "Stages bientot termines",
      message: "Deux stages actifs arrivent a echeance dans les 15 prochains jours.",
      lien: "/stages?statut=EN_COURS",
      isRead: false,
      createdAt: shiftDays(now, -1),
    },
    {
      id: "notification-3",
      destinataireId: "user-rh-2",
      type: "RAPPORT_SUBMITTED",
      titre: "Rapport en attente de revue",
      message: "Le rapport semaine 3 d Amina El Idrissi attend une validation.",
      lien: "/rapports",
      isRead: false,
      createdAt: shiftDays(now, -1),
    },
    {
      id: "notification-4",
      destinataireId: "user-enc-1",
      type: "RAPPORT_RETURNED",
      titre: "Rapport retourne",
      message: "Le rapport de Sara Bousfiha a ete retourne avec demande de precisions.",
      lien: "/rapports",
      isRead: true,
      createdAt: shiftDays(now, -3),
    },
    {
      id: "notification-5",
      destinataireId: "user-enc-2",
      type: "RAPPORT_SUBMITTED",
      titre: "Revue encadrant requise",
      message: "Le rapport semaine 3 de Yassine Tazi a ete soumis.",
      lien: "/rapports",
      isRead: false,
      createdAt: shiftDays(now, -2),
    },
    {
      id: "notification-6",
      destinataireId: "user-enc-3",
      type: "STAGE_ENDING_SOON",
      titre: "Anticiper la cloture",
      message: "Un stage sous votre supervision arrive bientot a son terme.",
      lien: "/stages",
      isRead: true,
      createdAt: shiftDays(now, -5),
    },
    {
      id: "notification-7",
      destinataireId: "user-stg-1",
      type: "RAPPORT_RETURNED",
      titre: "Ajustements demandes",
      message: "Votre rapport semaine 2 doit etre complete avant validation finale.",
      lien: "/rapports",
      isRead: false,
      createdAt: shiftDays(now, -10),
    },
    {
      id: "notification-8",
      destinataireId: "user-stg-2",
      type: "RAPPORT_SUBMITTED",
      titre: "Rapport bien transmis",
      message: "Votre dernier rapport a ete transmis a votre encadrant.",
      lien: "/rapports",
      isRead: true,
      createdAt: shiftDays(now, -2),
    },
    {
      id: "notification-9",
      destinataireId: "user-stg-3",
      type: "STAGIAIRE_CREATED",
      titre: "Nouveau stage planifie",
      message: "Votre prochain stage a ete planifie avec l equipe Data platform.",
      lien: "/stagiaires/stagiaire-3",
      isRead: false,
      createdAt: shiftDays(now, -1),
    },
    {
      id: "notification-10",
      destinataireId: "user-stg-8",
      type: "RAPPORT_RETURNED",
      titre: "Reprendre le rapport",
      message: "Le rapport semaine 2 a ete retourne avec commentaire de l encadrant.",
      lien: "/rapports",
      isRead: false,
      createdAt: shiftDays(now, -4),
    },
  ];

  const auditLogs = [
    {
      id: "audit-seed-bootstrap",
      userId: "user-admin-1",
      action: "SEED_INITIAL",
      entite: "SYSTEM",
      entiteId: "bootstrap",
      nouvelleValeur: {
        stagiaires: 8,
        encadrants: 4,
        rapports: rapports.length,
        documents: documentRows.length,
      },
      ip: "127.0.0.1",
      userAgent: "seed-script",
      createdAt: shiftDays(now, -1),
    },
    ...stages.map((stage, index) => ({
      id: `audit-stage-${index + 1}`,
      userId: index % 2 === 0 ? "user-rh-1" : "user-rh-2",
      action: "STAGE_CREATE",
      entite: "Stage",
      entiteId: stage.id,
      nouvelleValeur: {
        stagiaireId: stage.stagiaireId,
        statut: stage.statut,
        departement: stage.departement,
      },
      ip: "127.0.0.1",
      userAgent: "seed-script",
      createdAt: shiftDays(stage.createdAt, 1),
    })),
    ...rapports.map((rapport, index) => ({
      id: `audit-rapport-${index + 1}`,
      userId:
        stages.find((stage) => stage.id === rapport.stageId)?.stagiaireId.replace("stagiaire", "user-stg") ??
        "user-stg-1",
      action:
        rapport.statut === RapportStatus.BROUILLON ? "RAPPORT_DRAFT_SAVE" : "RAPPORT_SUBMIT",
      entite: "Rapport",
      entiteId: rapport.id,
      nouvelleValeur: {
        stageId: rapport.stageId,
        semaine: rapport.semaine,
        statut: rapport.statut,
      },
      ip: "127.0.0.1",
      userAgent: "seed-script",
      createdAt: rapport.updatedAt,
    })),
    ...documentRows.map((document, index) => ({
      id: `audit-document-${index + 1}`,
      userId: document.auteurId,
      action: "DOCUMENT_UPLOAD",
      entite: "Document",
      entiteId: document.id,
      nouvelleValeur: {
        stageId: document.stageId,
        type: document.type,
        nom: document.nom,
      },
      ip: "127.0.0.1",
      userAgent: "seed-script",
      createdAt: document.createdAt,
    })),
    ...evaluations.map((evaluation, index) => ({
      id: `audit-evaluation-${index + 1}`,
      userId: evaluation.createdByUserId ?? "user-enc-1",
      action:
        evaluation.status === EvaluationStatus.VALIDE
          ? "EVALUATION_VALIDATE"
          : evaluation.status === EvaluationStatus.RETOURNE
            ? "EVALUATION_RETURN"
            : "EVALUATION_SUBMIT",
      entite: "Evaluation",
      entiteId: evaluation.id,
      nouvelleValeur: {
        stageId: evaluation.stageId,
        type: evaluation.type,
        status: evaluation.status,
        totalScore: evaluation.totalScore,
        maxScore: evaluation.maxScore,
      },
      ip: "127.0.0.1",
      userAgent: "seed-script",
      createdAt: evaluation.updatedAt,
    })),
  ];

  await resetStorage();

  for (const document of documents) {
    const directory = path.dirname(document.url);
    await mkdir(directory, { recursive: true });
    await writeFile(document.url, document.content, "utf8");
  }

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany();
    await tx.pdfGenerationJob.deleteMany();
    await tx.notificationDispatchJob.deleteMany();
    await tx.notification.deleteMany();
    await tx.notificationPreference.deleteMany();
    await tx.document.deleteMany();
    await tx.evaluationRevision.deleteMany();
    await tx.evaluation.deleteMany();
    await tx.githubSyncLog.deleteMany();
    await tx.githubConnection.deleteMany();
    await tx.rapport.deleteMany();
    await tx.presence.deleteMany();
    await tx.stage.deleteMany();
    await tx.stagiaire.deleteMany();
    await tx.user.deleteMany();

    await tx.user.createMany({
      data: users.map((user) => ({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        passwordHash,
        role: user.role,
        isActive: user.isActive ?? true,
        createdAt: shiftDays(now, -300),
        updatedAt: shiftDays(now, -1),
      })),
    });

    await tx.stagiaire.createMany({
      data: stagiaires.map((stagiaire, index) => ({
        ...stagiaire,
        createdAt: shiftDays(now, -280 + index),
        updatedAt: shiftDays(now, -2),
      })),
    });

    await tx.stage.createMany({
      data: stages,
    });

    await tx.rapport.createMany({
      data: rapports,
    });

    await tx.evaluation.createMany({
      data: evaluations,
    });

    await tx.evaluationRevision.createMany({
      data: evaluationRevisions,
    });

    await tx.document.createMany({
      data: documentRows,
    });

    await tx.notification.createMany({
      data: notifications,
    });

    await tx.auditLog.createMany({
      data: auditLogs,
    });
  });

  console.log(
    JSON.stringify(
      {
        users: users.length,
        rh: users.filter((user) => user.role === Role.RH).length,
        encadrants: users.filter((user) => user.role === Role.ENCADRANT).length,
        stagiaires: stagiaires.length,
        stages: stages.length,
        rapports: rapports.length,
        evaluations: evaluations.length,
        evaluationRevisions: evaluationRevisions.length,
        documents: documentRows.length,
        notifications: notifications.length,
        auditLogs: auditLogs.length,
        defaultPassword: DEFAULT_USER_PASSWORD,
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
