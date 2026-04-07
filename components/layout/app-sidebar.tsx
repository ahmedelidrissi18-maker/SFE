import Link from "next/link";
import { FolderKanban, LayoutDashboard, Users } from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { hasRole } from "@/lib/rbac";
import type { UserRole } from "@/types";

const iconMap = {
  dashboard: LayoutDashboard,
  stagiaires: Users,
  stages: FolderKanban,
};

type AppSidebarProps = {
  role: UserRole;
};

export function AppSidebar({ role }: AppSidebarProps) {
  const allowedNavigation = navigationItems.filter((item) => hasRole(role, [...item.roles]));

  return (
    <aside className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
      <div className="border-b border-border pb-5">
        <p className="text-sm font-medium text-primary">SFE</p>
        <h2 className="mt-2 text-xl font-semibold">Gestion des Stagiaires</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Socle UI et data pret pour le premier lot fonctionnel.
        </p>
      </div>

      <nav className="mt-5 space-y-2">
        {allowedNavigation.map((item) => {
          const Icon = iconMap[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                "hover:bg-accent hover:text-primary",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
