import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
};

const statusClassName: Record<string, string> = {
  "En cours": "bg-emerald-50 text-emerald-700",
  Planifie: "bg-amber-50 text-amber-700",
  Termine: "bg-slate-100 text-slate-700",
  Suspendu: "bg-orange-50 text-orange-700",
  Annule: "bg-rose-50 text-rose-700",
  "Aucun stage": "bg-slate-100 text-slate-700",
  Actif: "bg-emerald-50 text-emerald-700",
  Archive: "bg-zinc-100 text-zinc-700",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        statusClassName[status] ?? "bg-slate-100 text-slate-700",
      )}
    >
      {status}
    </span>
  );
}
