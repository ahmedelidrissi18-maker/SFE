"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { hasRole } from "@/lib/rbac";
import type { UserRole } from "@/types";

const iconMap = {
  dashboard: "dashboard",
  analytics: "analytics",
  stagiaires: "group",
  stages: "work",
  rapports: "description",
  evaluations: "grading",
  documents: "folder",
  notifications: "notifications",
  security: "verified_user",
};

const sectionLabels = {
  accueil: "Accueil",
  suivi: "Suivi",
  compte: "Compte",
};

const sectionDescriptions = {
  accueil: "Vision globale et indicateurs de pilotage.",
  suivi: "Parcours metier, operations et actions de suivi.",
  compte: "Alertes, securite et preferences personnelles.",
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Vue administration",
  RH: "Vue RH",
  ENCADRANT: "Vue encadrant",
  STAGIAIRE: "Vue stagiaire",
};

type AppSidebarProps = {
  role: UserRole;
};

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const allowedNavigation = navigationItems.filter((item) => hasRole(role, [...item.roles]));
  const groupedNavigation = allowedNavigation.reduce<Record<string, (typeof allowedNavigation)[number][]>>(
    (sections, item) => {
      if (!sections[item.section]) {
        sections[item.section] = [];
      }

      sections[item.section].push(item);
      return sections;
    },
    {},
  );

  return (
    <aside className="min-w-0 lg:h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-[28px] bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-primary text-on-primary">
            <MaterialSymbol icon="work" className="text-[20px]" filled />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight text-primary">InternFlow</h2>
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              {roleLabels[role]}
            </p>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-6 overflow-y-auto pr-1" aria-label="Navigation principale">
          {Object.entries(groupedNavigation).map(([section, items]) => (
            <section key={section} className="space-y-2">
              <div className="space-y-1 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                  {sectionLabels[section as keyof typeof sectionLabels]}
                </p>
                <p className="text-xs leading-5 text-on-surface-variant">
                  {sectionDescriptions[section as keyof typeof sectionDescriptions]}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {items.map((item) => {
                  const icon = iconMap[item.icon];
                  const isCurrent = isCurrentPath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isCurrent ? "page" : undefined}
                      className={cn(
                        "group flex min-h-14 items-center gap-3 rounded-[22px] px-3.5 py-3 text-sm font-medium transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                        isCurrent
                          ? "bg-surface-container-low text-on-surface shadow-[var(--shadow-soft)]"
                          : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] transition",
                          isCurrent
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-lowest text-on-surface-variant group-hover:text-primary",
                        )}
                      >
                        <MaterialSymbol icon={icon} className="text-[18px]" filled={isCurrent} />
                      </span>
                      <span className="min-w-0 truncate">{item.label}</span>
                      <span
                        className={cn(
                          "ml-auto h-2.5 w-2.5 shrink-0 rounded-full transition",
                          isCurrent ? "bg-primary" : "bg-surface-container-highest group-hover:bg-primary-fixed-dim",
                        )}
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </div>
    </aside>
  );
}
