import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  helper: string;
  accent?: ReactNode;
  borderLeftClass?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  helperClassName?: string;
  contentClassName?: string;
};

export function MetricCard({
  label,
  value,
  helper,
  accent,
  borderLeftClass,
  className,
  labelClassName,
  valueClassName,
  helperClassName,
  contentClassName,
}: MetricCardProps) {
  const valueTitle =
    typeof value === "string" || typeof value === "number" ? String(value) : undefined;

  return (
    <Card className={cn("relative overflow-hidden min-h-[140px] transition-all duration-300 hover:-translate-y-1 hover:shadow-md", borderLeftClass || "bg-card", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className={cn("min-w-0 flex-1", contentClassName)}>
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant",
              labelClassName,
            )}
            title={label}
          >
            {label}
          </p>
          <p
            className={cn(
              "mt-3 break-words text-3xl font-bold tracking-tight text-on-surface",
              valueClassName,
            )}
            title={valueTitle}
          >
            {value}
          </p>
          <p
            className={cn(
              "mt-2 max-w-none text-sm leading-6 text-on-surface-variant sm:max-w-[40ch]",
              helperClassName,
            )}
            title={helper}
          >
            {helper}
          </p>
        </div>
        {accent ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-surface-container-low text-primary">
            {accent}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
