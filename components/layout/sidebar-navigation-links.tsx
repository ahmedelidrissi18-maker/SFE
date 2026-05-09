"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "@/lib/navigation";

type SidebarNavigationLinksProps = {
  items: NavigationItem[];
  onNavigate?: () => void;
};

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
} as const;

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNavigationLinks({ items, onNavigate }: SidebarNavigationLinksProps) {
  const pathname = usePathname();

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => {
        const isCurrent = isCurrentPath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isCurrent ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] text-sm transition-colors duration-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              isCurrent
                ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                : "font-medium text-muted-foreground hover:bg-accent border-l-2 border-transparent",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition",
                isCurrent
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-lowest text-on-surface-variant group-hover:text-primary",
              )}
            >
              <MaterialSymbol icon={iconMap[item.icon]} className="text-[18px]" filled={isCurrent} />
            </span>
            <span className="min-w-0 flex-1 break-words leading-5">{item.label}</span>
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full transition",
                isCurrent ? "bg-primary" : "bg-surface-container-highest group-hover:bg-primary-fixed-dim",
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}
