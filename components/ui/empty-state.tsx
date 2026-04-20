import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: string;
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
  icon,
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
        "overflow-hidden bg-card",
        align === "center" ? "text-center" : "text-left",
      )}
    >
      <div
        className={cn(
          "relative flex max-w-md flex-col gap-4 py-4",
          align === "center" ? "mx-auto items-center" : "items-start",
        )}
      >
        <div className="absolute left-1/2 top-10 h-24 w-24 -translate-x-1/2 rounded-full bg-primary-fixed blur-3xl opacity-80" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-surface-container-low text-primary">
          <MaterialSymbol icon={icon ?? "inbox"} className="text-[28px]" filled />
        </div>
        <div className="relative space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-sm leading-6 text-on-surface-variant">{description}</p>
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
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-[var(--shadow-ambient)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2"
            >
              {actionLabel}
            </Link>
            {secondaryActionHref && secondaryActionLabel ? (
              <Link
                href={secondaryActionHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-surface-container-low px-5 py-3 text-sm font-semibold text-on-surface shadow-[var(--shadow-soft)] transition hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2"
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
