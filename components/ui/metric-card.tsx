import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  helper: string;
  accent?: ReactNode;
};

export function MetricCard({ label, value, helper, accent }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/80 bg-linear-to-br from-card via-card to-primary-soft/20">
      <div className="absolute right-[-2rem] top-[-2rem] h-24 w-24 rounded-full bg-primary/10 blur-3xl" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center rounded-full bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {label}
          </p>
          <p className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{value}</p>
          <p className="mt-3 max-w-[28ch] text-sm leading-6 text-muted">{helper}</p>
        </div>
        {accent ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-primary text-primary-foreground shadow-[0_20px_40px_-28px_rgba(15,118,110,0.72)]">
            {accent}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
