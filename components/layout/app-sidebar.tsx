"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  ClipboardCheck,
  FileArchive,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { hasRole } from "@/lib/rbac";
import type { UserRole } from "@/types";

const iconMap = {
  dashboard: LayoutDashboard,
  analytics: BarChart3,
  stagiaires: Users,
  stages: FolderKanban,
  rapports: FileText,
  evaluations: ClipboardCheck,
  documents: FileArchive,
  notifications: Bell,
  security: ShieldCheck,
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
    <aside className="min-w-0 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
      <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-border/80 bg-linear-to-b from-card via-card to-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="overflow-hidden rounded-[28px] bg-linear-to-br from-primary via-primary to-cyan-700 p-5 text-primary-foreground shadow-[0_24px_56px_-28px_rgba(15,118,110,0.68)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-white/15 bg-white/10 text-lg font-semibold backdrop-blur-sm">
              S
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">SFE</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Gestion des stagiaires</h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Espace de travail structure pour piloter stages, rapports, documents et alertes.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <span className="inline-flex items-center rounded-full bg-white/14 px-3 py-1.5 text-xs font-semibold text-white">
              {roleLabels[role]}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              {allowedNavigation.length} modules
            </span>
          </div>
        </div>

        <nav className="mt-5 flex-1 space-y-6 overflow-y-auto pr-1" aria-label="Navigation principale">
          {Object.entries(groupedNavigation).map(([section, items]) => (
            <section key={section} className="space-y-2">
              <div className="space-y-1 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {sectionLabels[section as keyof typeof sectionLabels]}
                </p>
                <p className="text-xs leading-5 text-muted">
                  {sectionDescriptions[section as keyof typeof sectionDescriptions]}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const isCurrent = isCurrentPath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isCurrent ? "page" : undefined}
                      className={cn(
                        "group flex min-h-14 items-center gap-3 rounded-[22px] border px-3.5 py-3 text-sm font-medium transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                        isCurrent
                          ? "border-primary/15 bg-primary-soft/70 text-foreground shadow-[0_18px_32px_-26px_rgba(15,118,110,0.42)]"
                          : "border-transparent text-foreground/80 hover:border-border hover:bg-surface hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] transition",
                          isCurrent
                            ? "bg-primary text-primary-foreground shadow-[0_20px_36px_-24px_rgba(15,118,110,0.72)]"
                            : "bg-background text-muted group-hover:bg-card group-hover:text-primary",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 truncate">{item.label}</span>
                      <span
                        className={cn(
                          "ml-auto h-2.5 w-2.5 shrink-0 rounded-full transition",
                          isCurrent ? "bg-primary" : "bg-border group-hover:bg-primary/35",
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
