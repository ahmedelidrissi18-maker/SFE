"use client";

import { usePathname } from "next/navigation";
import { LiveNotificationLink } from "@/components/features/notifications/live-notification-link";
import { SessionDropdown } from "@/components/layout/session-dropdown";
import { MaterialSymbol } from "@/components/ui/material-symbol";
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

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  stagiaires: "Stagiaires",
  stages: "Stages",
  rapports: "Rapports",
  evaluations: "Evaluations",
  documents: "Documents",
  notifications: "Notifications",
  securite: "Securite",
};

export function AppHeader({ user, unreadNotificationsCount = 0 }: AppHeaderProps) {
  const pathname = usePathname();
  const displayName = [user.prenom, user.nom].filter(Boolean).join(" ") || user.email || "Utilisateur";
  const roleLabel = user.role ? roleLabels[user.role] : "Utilisateur";
  const initials = getInitials(displayName) || "UT";
  const currentSection = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const pageTitle = pageTitles[currentSection] ?? "Gestion des stagiaires";
  const currentDateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 rounded-[26px] bg-white/82 px-5 py-4 shadow-[0px_12px_32px_rgba(26,28,29,0.04)] backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
              {roleLabel}
            </p>
            <h1 className="text-xl font-bold tracking-tight text-on-surface sm:text-2xl">
              {pageTitle}
            </h1>
          </div>
          <div className="hidden h-4 w-px bg-outline-variant/40 lg:block" />
          <label className="relative w-full max-w-md">
            <MaterialSymbol
              icon="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
            />
            <input
              type="search"
              placeholder="Rechercher un stagiaire, un rapport, un document..."
              className="w-full rounded-full border-none bg-surface-container-low pl-10 pr-4 py-2 text-sm text-on-surface shadow-none"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-end">
          <LiveNotificationLink initialUnreadCount={unreadNotificationsCount} />
          <button
            type="button"
            aria-label="Aide"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-surface-container-low px-4 text-on-surface shadow-[var(--shadow-soft)] transition hover:bg-surface-container-high hover:text-primary"
          >
            <MaterialSymbol icon="help" className="text-[20px]" />
          </button>
          <SessionDropdown
            key={pathname}
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
