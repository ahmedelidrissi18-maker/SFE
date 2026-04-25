"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "@/lib/navigation";

type SidebarNavigationLinksProps = {
  items: NavigationItem[];
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

export function SidebarNavigationLinks({ items }: SidebarNavigationLinksProps) {
  const pathname = usePathname();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => {
        const isCurrent = isCurrentPath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrent ? "page" : undefined}
            className={cn(
              "group flex min-h-14 items-start gap-3 rounded-[22px] px-3.5 py-3 text-sm font-medium transition-all",
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
              <MaterialSymbol icon={iconMap[item.icon]} className="text-[18px]" filled={isCurrent} />
            </span>
            <span className="min-w-0 flex-1 break-words leading-5">{item.label}</span>
            <span
              className={cn(
                "mt-3 h-2.5 w-2.5 shrink-0 rounded-full transition",
                isCurrent ? "bg-primary" : "bg-surface-container-highest group-hover:bg-primary-fixed-dim",
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}
