import { LogoutButton } from "@/components/auth/logout-button";
import { LiveNotificationLink } from "@/components/features/notifications/live-notification-link";
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

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppHeader({ user, unreadNotificationsCount = 0 }: AppHeaderProps) {
  const displayName = [user.prenom, user.nom].filter(Boolean).join(" ") || user.email || "Utilisateur";
  const roleLabel = user.role ? roleLabels[user.role] : "Utilisateur";
  const initials = getInitials(displayName) || "UT";
  const currentDateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-linear-to-r from-card/95 via-card/90 to-surface/90 px-5 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Espace interne securise
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              {roleLabel}
            </span>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Gestion des stagiaires
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Suivi administratif, pedagogique et documentaire dans un espace unique, fiable et
              lisible.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-end">
          <LiveNotificationLink initialUnreadCount={unreadNotificationsCount} />
          <div className="min-w-[260px] rounded-[24px] border border-border/80 bg-linear-to-br from-background to-card px-4 py-3 text-sm shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-primary text-sm font-semibold text-primary-foreground shadow-[0_20px_36px_-24px_rgba(15,118,110,0.74)]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Session active
                </p>
                <p className="truncate font-semibold text-foreground">{displayName}</p>
                <p className="truncate text-sm text-muted">{user.email ?? roleLabel}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-[18px] border border-border/70 bg-card/90 px-3 py-2 text-xs">
              <span className="font-medium text-foreground/80">{roleLabel}</span>
              <span className="text-muted">{currentDateLabel}</span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
