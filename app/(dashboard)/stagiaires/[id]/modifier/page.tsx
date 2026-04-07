import { notFound } from "next/navigation";
import { updateStagiaireAction } from "@/app/(dashboard)/stagiaires/actions";
import { StagiaireForm } from "@/components/features/stagiaires/stagiaire-form";
import { prisma } from "@/lib/prisma";

type EditStagiairePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditStagiairePage({ params }: EditStagiairePageProps) {
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

  return (
    <StagiaireForm
      title="Modifier le stagiaire"
      description="Mettez a jour les informations de la fiche stagiaire. Les changements sont enregistres en base puis refletes dans la liste."
      submitLabel="Enregistrer les modifications"
      action={updateStagiaireAction}
      cancelHref={`/stagiaires/${stagiaire.id}`}
      defaultValues={{
        stagiaireId: stagiaire.id,
        userId: stagiaire.userId,
        nom: stagiaire.user.nom,
        prenom: stagiaire.user.prenom,
        email: stagiaire.user.email,
        cin: stagiaire.cin,
        telephone: stagiaire.telephone ?? "",
        dateNaissance: stagiaire.dateNaissance
          ? stagiaire.dateNaissance.toISOString().slice(0, 10)
          : "",
        etablissement: stagiaire.etablissement ?? "",
        specialite: stagiaire.specialite ?? "",
        niveau: stagiaire.niveau ?? "",
        annee: stagiaire.annee ?? "",
        photoUrl: stagiaire.photoUrl ?? "",
      }}
    />
  );
}
