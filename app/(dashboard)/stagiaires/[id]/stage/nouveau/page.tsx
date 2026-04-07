import { notFound } from "next/navigation";
import { createStageAction, getStageFormOptions } from "@/app/(dashboard)/stages/actions";
import { StageForm } from "@/components/features/stages/stage-form";
import { prisma } from "@/lib/prisma";

type NewStageForStagiairePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewStageForStagiairePage({ params }: NewStageForStagiairePageProps) {
  const { id } = await params;

  const stagiaire = await prisma.stagiaire.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });

  if (!stagiaire) {
    notFound();
  }

  const options = await getStageFormOptions();

  return (
    <StageForm
      title="Nouveau stage"
      description={`Creez un stage pour ${`${stagiaire.user.prenom} ${stagiaire.user.nom}`.trim()} et affectez-lui un encadrant.`}
      submitLabel="Creer le stage"
      action={createStageAction}
      stagiaires={options.stagiaires}
      encadrants={options.encadrants}
      lockStagiaire
      cancelHref={`/stagiaires/${stagiaire.id}`}
      defaultValues={{
        stagiaireId: stagiaire.id,
      }}
    />
  );
}
