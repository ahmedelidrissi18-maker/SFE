import { LogoutButton } from "@/components/auth/logout-button";
import type { UserRole } from "@/types";

type AppHeaderProps = {
  user: {
    nom?: string | null;
    prenom?: string | null;
    email?: string | null;
    role?: UserRole | null;
  };
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  RH: "Responsable RH",
  ENCADRANT: "Encadrant",
  STAGIAIRE: "Stagiaire",
};

export function AppHeader({ user }: AppHeaderProps) {
  const displayName = [user.prenom, user.nom].filter(Boolean).join(" ") || user.email || "Utilisateur";
  const roleLabel = user.role ? roleLabels[user.role] : "Utilisateur";

  return (
    <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-8">
      <div>
        <p className="text-sm font-medium text-primary">Plateforme interne</p>
        <h1 className="text-lg font-semibold">Gestion des stagiaires</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-full border border-border bg-background px-4 py-2 text-right text-sm text-muted">
          <p className="font-medium text-foreground">{displayName}</p>
          <p>{roleLabel}</p>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
