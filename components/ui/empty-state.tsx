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
        <div className="relative flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-surface-container-low text-primary">
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
              "flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap",
              align === "center" ? "justify-center" : "justify-start",
            )}
          >
            <Link
              href={actionHref}
              className="action-button action-button-primary w-full px-5 py-3 text-sm sm:w-auto"
            >
              {actionLabel}
            </Link>
            {secondaryActionHref && secondaryActionLabel ? (
              <Link
                href={secondaryActionHref}
                className="action-button action-button-secondary w-full px-5 py-3 text-sm sm:w-auto"
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
