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

type AppSidebarProps = {
  role: UserRole;
};

export function AppSidebar({ role }: AppSidebarProps) {
  const allowedNavigation = navigationItems.filter((item) => hasRole(role, [...item.roles]));
  const groupedNavigation = allowedNavigation.reduce<Record<NavigationSection, (typeof allowedNavigation)[number][]>>(
    (sections, item) => {
      if (!sections[item.section]) {
        sections[item.section] = [];
      }

      sections[item.section].push(item);
      return sections;
    },
    {} as Record<NavigationSection, (typeof allowedNavigation)[number][]>,
  );

  return (
    <aside className="min-w-0 text-foreground lg:h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card/95 p-4 shadow-[var(--shadow-card)] backdrop-blur-sm">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary">
            <MaterialSymbol icon="work" className="text-[20px]" filled />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight text-primary">InternFlow</h2>
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              {roleLabels[role]}
            </p>
          </div>
        </div>

        <nav className="mt-5 flex-1 space-y-7 overflow-y-auto pb-2 pr-1" aria-label="Navigation principale">
          {Object.entries(groupedNavigation).map(([section, items], index) => (
            <section
              key={section}
              className={cn("space-y-3", index > 0 && "my-4 border-t border-border pt-4")}
            >
              <div className="px-1">
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {sectionLabels[section as keyof typeof sectionLabels]}
                </p>
                <p className="text-xs leading-5 text-on-surface-variant">
                  {sectionDescriptions[section as keyof typeof sectionDescriptions]}
                </p>
              </div>
              <SidebarNavigationLinks items={items} />
            </section>
          ))}
        </nav>
      </div>
    </aside>
  );
}
