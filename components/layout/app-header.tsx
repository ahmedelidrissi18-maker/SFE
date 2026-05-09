import { LiveNotificationLink } from "@/components/features/notifications/live-notification-link";
import { CurrentPageTitle } from "@/components/layout/current-page-title";
import { MobileNavigationDrawer } from "@/components/layout/mobile-navigation-drawer";
import { SessionDropdown } from "@/components/layout/session-dropdown";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppHeader({ user }: AppHeaderProps) {
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
    <header className="sticky top-0 z-20 h-16 rounded-lg border border-border bg-card px-4 shadow-[var(--shadow-soft)] sm:px-6 lg:px-8">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {user.role ? <MobileNavigationDrawer role={user.role} /> : null}
            <div className="hidden min-w-0 space-y-1 sm:block">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {roleLabel}
              </p>
              <CurrentPageTitle />
            </div>
          </div>
          <div className="hidden h-4 w-px bg-outline-variant/40 lg:block" />
          <form action="/search" className="hidden min-w-0 flex-1 md:block lg:max-w-[38rem]">
            <input
              type="search"
              name="q"
              placeholder="Rechercher un stagiaire, un rapport ou un document"
              title="Rechercher un stagiaire, un rapport ou un document"
              className="w-full max-w-xs rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none transition"
            />
          </form>
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <div className="flex items-center gap-1 px-2 border-r border-border mr-2">
            <LiveNotificationLink />
            <ThemeToggle />
          </div>
          <SessionDropdown
            displayName={displayName}
            email={user.email ?? roleLabel}
            roleLabel={roleLabel}
            currentDateLabel={currentDateLabel}
            initials={initials}
          />
        </div>
      </div>
    </header>
  );
}
