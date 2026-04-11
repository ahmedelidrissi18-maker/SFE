import Link from "next/link";
import { Bell, FileText, FolderKanban, LayoutDashboard, Users } from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { hasRole } from "@/lib/rbac";
import type { UserRole } from "@/types";

const iconMap = {
  dashboard: LayoutDashboard,
  stagiaires: Users,
  stages: FolderKanban,
  rapports: FileText,
  notifications: Bell,
};

type AppSidebarProps = {
  role: UserRole;
};

export function AppSidebar({ role }: AppSidebarProps) {
  const allowedNavigation = navigationItems.filter((item) => hasRole(role, [...item.roles]));

  return (
    <aside className="rounded-[28px] border border-border/80 bg-linear-to-br from-card via-card to-accent/50 p-5 shadow-[0_24px_48px_-32px_rgba(15,23,42,0.45)] lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
      <div className="border-b border-border/80 pb-5">
        <p className="text-sm font-medium text-primary">SFE</p>
        <h2 className="mt-2 text-xl font-semibold">Gestion des Stagiaires</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Base metier en place pour le suivi des stages et des rapports.
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
                "flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium transition",
                "hover:border-border hover:bg-background hover:text-primary",
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
