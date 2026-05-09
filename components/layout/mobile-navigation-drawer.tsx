"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SidebarNavigationLinks } from "@/components/layout/sidebar-navigation-links";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { navigationItems, type NavigationSection } from "@/lib/navigation";
import { hasRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

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

type MobileNavigationDrawerProps = {
  role: UserRole;
};

export function MobileNavigationDrawer({ role }: MobileNavigationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const allowedNavigation = useMemo(
    () => navigationItems.filter((item) => hasRole(role, [...item.roles])),
    [role],
  );
  const groupedNavigation = useMemo(
    () =>
      allowedNavigation.reduce<Record<NavigationSection, (typeof allowedNavigation)[number][]>>(
        (sections, item) => {
          if (!sections[item.section]) {
            sections[item.section] = [];
          }

          sections[item.section].push(item);
          return sections;
        },
        {} as Record<NavigationSection, (typeof allowedNavigation)[number][]>,
      ),
    [allowedNavigation],
  );

  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;

    if (isOpen) {
      body.style.overflow = "hidden";
    }

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors lg:hidden"
        aria-label="Ouvrir la navigation"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
      >
        <MaterialSymbol icon="menu" className="text-[20px]" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <button
          type="button"
          className="absolute inset-0"
          aria-label="Fermer la navigation"
          onClick={() => setIsOpen(false)}
        />

        <aside
          id="mobile-navigation-drawer"
          className={cn(
            "absolute inset-y-0 left-0 flex w-full max-w-[22rem] flex-col border-r border-border bg-card/95 p-4 shadow-[var(--shadow-card)] backdrop-blur-md transition-transform",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Navigation mobile"
        >
          <div className="flex items-start justify-between gap-3 px-1 py-2">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary">
                <MaterialSymbol icon="work" className="text-[20px]" filled />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold tracking-tight text-primary">InternFlow</p>
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  {roleLabels[role]}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors"
              aria-label="Fermer la navigation"
            >
              <MaterialSymbol icon="close" className="text-[20px]" />
            </button>
          </div>

          <nav className="mt-5 flex-1 overflow-y-auto pb-4 pr-1" aria-label="Navigation principale">
            {Object.entries(groupedNavigation).map(([section, items], index) => (
              <section
                key={section}
                className={cn("space-y-3", index > 0 && "my-4 border-t border-border pt-4")}
              >
                <div className="px-1">
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {sectionLabels[section as keyof typeof sectionLabels]}
                  </p>
                </div>
                <SidebarNavigationLinks items={items} onNavigate={() => setIsOpen(false)} />
              </section>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
