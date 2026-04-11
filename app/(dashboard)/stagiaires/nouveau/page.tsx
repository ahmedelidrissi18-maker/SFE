import { createStagiaireAction } from "@/app/(dashboard)/stagiaires/actions";
import { StagiaireForm } from "@/components/features/stagiaires/stagiaire-form";
import { DEFAULT_USER_PASSWORD } from "@/lib/app-config";

export default function NewStagiairePage() {
  return (
    <StagiaireForm
      title="Nouveau stagiaire"
      description="Creez une fiche stagiaire avec ses informations personnelles et academiques. Un compte de connexion stagiaire sera cree automatiquement."
      submitLabel="Creer le stagiaire"
      action={createStagiaireAction}
      showCredentialsHint
      credentialsHint={DEFAULT_USER_PASSWORD}
      cancelHref="/stagiaires"
    />
  );
}
