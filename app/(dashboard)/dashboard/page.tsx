import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getStageStatusLabel } from "@/lib/stages";

export default async function DashboardPage() {
  const session = await auth();
  const now = new Date();
  const soonDate = new Date(now);
  soonDate.setDate(soonDate.getDate() + 15);

  const userRole = session?.user.role;

  const [
    activeStagiairesCount,
    activeStagesCount,
    endingSoonCount,
    encadrantsCount,
    myAssignedStagesCount,
    myStages,
    myStagiaireRecord,
  ] = await Promise.all([
    prisma.stagiaire.count({
      where: {
        user: {
          isActive: true,
          role: Role.STAGIAIRE,
        },
      },
    }),
    prisma.stage.count({
      where: {
        statut: {
          in: ["PLANIFIE", "EN_COURS", "SUSPENDU"],
        },
        ...(userRole === "ENCADRANT" ? { encadrantId: session?.user.id } : {}),
      },
    }),
    prisma.stage.count({
      where: {
        dateFin: {
          gte: now,
          lte: soonDate,
        },
        ...(userRole === "ENCADRANT" ? { encadrantId: session?.user.id } : {}),
      },
    }),
    prisma.user.count({
      where: {
        role: Role.ENCADRANT,
        isActive: true,
      },
    }),
    prisma.stage.count({
      where: {
        encadrantId: session?.user.id,
      },
    }),
    prisma.stage.findMany({
      where: {
        ...(userRole === "ENCADRANT" ? { encadrantId: session?.user.id } : {}),
      },
      orderBy: [{ dateDebut: "desc" }],
      take: 4,
      include: {
        stagiaire: {
          include: {
            user: true,
          },
        },
      },
    }),
    session?.user.role === "STAGIAIRE"
      ? prisma.stagiaire.findUnique({
          where: {
            userId: session.user.id,
          },
          include: {
            stages: {
              orderBy: [{ createdAt: "desc" }],
              take: 1,
              include: {
                encadrant: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const metrics =
    userRole === "ENCADRANT"
      ? [
          { label: "Stages assignes", value: String(myAssignedStagesCount), helper: "Tous vos stages" },
          { label: "Stages actifs", value: String(activeStagesCount), helper: "Planifies, en cours ou suspendus" },
          { label: "Fin proche", value: String(endingSoonCount), helper: "Fin de stage sous 15 jours" },
          { label: "Encadrants actifs", value: String(encadrantsCount), helper: "Vision globale du parc" },
        ]
      : userRole === "STAGIAIRE"
        ? [
            {
              label: "Mon compte",
              value: myStagiaireRecord ? "Actif" : "Aucun",
              helper: "Etat de votre fiche",
            },
            {
              label: "Mon stage",
              value: myStagiaireRecord?.stages[0] ? getStageStatusLabel(myStagiaireRecord.stages[0].statut) : "Aucun",
              helper: "Dernier stage rattache",
            },
            {
              label: "Date de fin",
              value: myStagiaireRecord?.stages[0]
                ? myStagiaireRecord.stages[0].dateFin.toISOString().slice(0, 10)
                : "-",
              helper: "Fin previsionnelle",
            },
            {
              label: "Encadrant",
              value: myStagiaireRecord?.stages[0]?.encadrant
                ? `${myStagiaireRecord.stages[0].encadrant.prenom} ${myStagiaireRecord.stages[0].encadrant.nom}`.trim()
                : "Non affecte",
              helper: "Encadrant du stage",
            },
          ]
        : [
            { label: "Stagiaires actifs", value: String(activeStagiairesCount), helper: "Comptes stagiaires actifs" },
            { label: "Stages actifs", value: String(activeStagesCount), helper: "Planifies, en cours ou suspendus" },
            { label: "Fins proches", value: String(endingSoonCount), helper: "Fin de stage sous 15 jours" },
            { label: "Encadrants actifs", value: String(encadrantsCount), helper: "Utilisateurs encadrants actifs" },
          ];

  const roadmap = [
    "Sprint 3 - Gestion des stages et affectation",
    "Sprint 4 - Rapports hebdomadaires",
    "Sprint 5 - Documents et notifications simples",
    "Sprint 6 - Stabilisation et livraison V1",
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-medium text-primary">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Vue de pilotage adaptee a votre role.
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted">
          Les indicateurs sont maintenant relies aux donnees reelles de la base pour suivre les stagiaires et les stages.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-muted">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight">{metric.value}</p>
            <p className="mt-2 text-xs text-muted">{metric.helper}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Activite recente</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Les derniers stages visibles dans votre perimetre selon votre role.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {myStages.length > 0 ? (
              myStages.map((stage) => (
                <div key={stage.id} className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-sm font-medium">
                    {`${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom}`.trim()}
                  </p>
                  <p className="mt-2 text-sm text-muted">{stage.departement}</p>
                  <p className="mt-1 text-sm text-muted">{getStageStatusLabel(stage.statut)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted md:col-span-2">
                Aucun stage recent a afficher pour le moment.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Suite recommandee</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
            {roadmap.map((item) => (
              <li key={item} className="rounded-2xl border border-border bg-background px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
