import { LiveNotificationLink } from "@/components/features/notifications/live-notification-link";
import { CurrentPageTitle } from "@/components/layout/current-page-title";
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
    <header className="sticky top-0 z-20 rounded-[26px] border border-outline-variant/50 bg-card/85 px-5 py-4 shadow-[var(--shadow-soft)] backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-1 lg:flex-row lg:items-center">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
              {roleLabel}
            </p>
            <CurrentPageTitle />
          </div>
          <div className="hidden h-4 w-px bg-outline-variant/40 lg:block" />
          <label className="w-full min-w-0 lg:min-w-[20rem] lg:flex-1 lg:max-w-[38rem]">
            <input
              type="search"
              placeholder="Rechercher un stagiaire, un rapport ou un document"
              title="Rechercher un stagiaire, un rapport ou un document"
              className="w-full rounded-full border-none bg-surface-container-low px-4 py-2 text-sm text-on-surface shadow-none"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-end">
          <LiveNotificationLink />
          <ThemeToggle />
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
