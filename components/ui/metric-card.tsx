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
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/80 via-primary to-sky-400/80" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-xs leading-5 text-muted">{helper}</p>
        </div>
        {accent ? <div className="text-primary">{accent}</div> : null}
      </div>
    </Card>
  );
}
