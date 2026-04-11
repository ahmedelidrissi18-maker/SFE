import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getStageFormOptions, updateStageAction } from "@/app/(dashboard)/stages/actions";
import { StageForm } from "@/components/features/stages/stage-form";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/rbac";

type EditStagePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditStagePage({ params }: EditStagePageProps) {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, ["ADMIN", "RH"])) {
    redirect("/acces-refuse");
  }

  const { id } = await params;

  const stage = await prisma.stage.findUnique({
    where: { id },
  });

  if (!stage) {
    notFound();
  }

  const options = await getStageFormOptions();

  return (
    <StageForm
      title="Modifier le stage"
      description="Mettez a jour la periode, le departement, l encadrant et le statut du stage."
      submitLabel="Enregistrer le stage"
      action={updateStageAction}
      stagiaires={options.stagiaires}
      encadrants={options.encadrants}
      lockStagiaire
      cancelHref={`/stagiaires/${stage.stagiaireId}`}
      defaultValues={{
        stageId: stage.id,
        stagiaireId: stage.stagiaireId,
        encadrantId: stage.encadrantId ?? "",
        dateDebut: stage.dateDebut.toISOString().slice(0, 10),
        dateFin: stage.dateFin.toISOString().slice(0, 10),
        departement: stage.departement,
        sujet: stage.sujet,
        githubRepo: stage.githubRepo ?? "",
        statut: stage.statut,
      }}
    />
  );
}
