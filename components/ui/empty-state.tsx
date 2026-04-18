import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  eyebrow?: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  align?: "center" | "left";
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  eyebrow,
  actionHref,
  actionLabel,
  secondaryActionHref,
  secondaryActionLabel,
  align = "center",
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden bg-linear-to-br from-card via-card to-primary-soft/20",
        align === "center" ? "text-center" : "text-left",
      )}
    >
      <div
        className={cn(
          "relative flex max-w-md flex-col gap-4 py-4",
          align === "center" ? "mx-auto items-center" : "items-start",
        )}
      >
        <div className="absolute left-1/2 top-10 h-24 w-24 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary text-primary-foreground shadow-[0_22px_42px_-28px_rgba(15,118,110,0.7)]">
          <Icon className="h-7 w-7" />
        </div>
        <div className="relative space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-sm leading-6 text-muted">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <div
            className={cn(
              "flex flex-wrap gap-3",
              align === "center" ? "justify-center" : "justify-start",
            )}
          >
            <Link
              href={actionHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_22px_42px_-28px_rgba(15,118,110,0.72)] transition hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2"
            >
              {actionLabel}
            </Link>
            {secondaryActionHref && secondaryActionLabel ? (
              <Link
                href={secondaryActionHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-linear-to-b from-background to-card px-5 py-3 text-sm font-semibold shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2"
              >
                {secondaryActionLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
