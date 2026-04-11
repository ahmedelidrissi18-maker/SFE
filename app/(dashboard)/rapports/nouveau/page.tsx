import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { saveRapportAction } from "@/app/(dashboard)/rapports/actions";
import { RapportForm } from "@/components/features/rapports/rapport-form";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";
import { getSuggestedRapportWeek } from "@/lib/rapports";
import { hasRole } from "@/lib/rbac";

export default async function NewRapportPage() {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, ["STAGIAIRE"])) {
    redirect("/acces-refuse");
  }

  const activeStage = await prisma.stage.findFirst({
    where: {
      stagiaire: {
        userId: session.user.id,
      },
      statut: {
        in: ["PLANIFIE", "EN_COURS", "SUSPENDU"],
      },
    },
    include: {
      stagiaire: {
        include: {
          user: true,
        },
      },
    },
    orderBy: [{ dateDebut: "desc" }],
  });

  if (!activeStage) {
    return (
      <EmptyState
        title="Aucun stage actif disponible"
        description="Vous devez disposer d un stage planifie, en cours ou suspendu pour creer un nouveau rapport hebdomadaire."
        actionHref="/rapports"
        actionLabel="Retour aux rapports"
      />
    );
  }

  const existingWeeks = await prisma.rapport.findMany({
    where: {
      stageId: activeStage.id,
    },
    select: {
      semaine: true,
    },
    orderBy: [{ semaine: "asc" }],
  });

  return (
    <RapportForm
      title="Nouveau rapport"
      description={`Creez le prochain rapport hebdomadaire pour ${`${activeStage.stagiaire.user.prenom} ${activeStage.stagiaire.user.nom}`.trim()}.`}
      action={saveRapportAction}
      stages={[
        {
          id: activeStage.id,
          label: `${activeStage.departement} · ${activeStage.sujet}`,
        },
      ]}
      cancelHref="/rapports"
      lockStage
      defaultValues={{
        stageId: activeStage.id,
        semaine: getSuggestedRapportWeek(
          activeStage.dateDebut,
          existingWeeks.map((rapport) => rapport.semaine),
        ),
        avancement: 0,
      }}
    />
  );
}
