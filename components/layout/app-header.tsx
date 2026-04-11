import Link from "next/link";
import { Bell } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import type { UserRole } from "@/types";

type AppHeaderProps = {
  user: {
    nom?: string | null;
    prenom?: string | null;
    email?: string | null;
    role?: UserRole | null;
  };
  unreadNotificationsCount?: number;
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  RH: "Responsable RH",
  ENCADRANT: "Encadrant",
  STAGIAIRE: "Stagiaire",
};

export function AppHeader({ user, unreadNotificationsCount = 0 }: AppHeaderProps) {
  const displayName = [user.prenom, user.nom].filter(Boolean).join(" ") || user.email || "Utilisateur";
  const roleLabel = user.role ? roleLabels[user.role] : "Utilisateur";

  return (
    <header className="flex flex-col gap-4 border-b border-border/80 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Plateforme interne</p>
        <h1 className="text-lg font-semibold">Gestion des stagiaires</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/notifications"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted transition hover:border-primary hover:text-primary"
          aria-label="Ouvrir les notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadNotificationsCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
            </span>
          ) : null}
        </Link>
        <div className="rounded-[20px] border border-border bg-background px-4 py-2 text-right text-sm text-muted">
          <p className="font-medium text-foreground">{displayName}</p>
          <p>{roleLabel}</p>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
