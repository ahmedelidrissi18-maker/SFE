import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  helper: string;
  accent?: ReactNode;
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
  className,
  labelClassName,
  valueClassName,
  helperClassName,
  contentClassName,
}: MetricCardProps) {
  const valueTitle =
    typeof value === "string" || typeof value === "number" ? String(value) : undefined;

  return (
    <Card className={cn("relative overflow-hidden bg-card", className)}>
      <div className="absolute right-[-2rem] top-[-2rem] h-24 w-24 rounded-full bg-primary-fixed blur-3xl opacity-80" />
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
              "mt-4 text-3xl font-semibold tracking-tight text-on-surface sm:text-4xl",
              valueClassName,
            )}
            title={valueTitle}
          >
            {value}
          </p>
          <p
            className={cn(
              "mt-3 max-w-[28ch] text-sm leading-6 text-on-surface-variant",
              helperClassName,
            )}
            title={helper}
          >
            {helper}
          </p>
        </div>
        {accent ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-primary">
            {accent}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
