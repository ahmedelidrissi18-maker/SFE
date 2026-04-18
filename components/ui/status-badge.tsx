import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
};

const statusClassName: Record<string, string> = {
  "En cours": "border-emerald-200/80 bg-emerald-50/85 text-emerald-700",
  Planifie: "border-amber-200/80 bg-amber-50/85 text-amber-700",
  Termine: "border-slate-200/85 bg-slate-100/85 text-slate-700",
  Suspendu: "border-orange-200/80 bg-orange-50/85 text-orange-700",
  Annule: "border-rose-200/80 bg-rose-50/85 text-rose-700",
  "Aucun stage": "border-slate-200/85 bg-slate-100/85 text-slate-700",
  Actif: "border-emerald-200/80 bg-emerald-50/85 text-emerald-700",
  Archive: "border-zinc-200/80 bg-zinc-100/85 text-zinc-700",
  Brouillon: "border-slate-200/85 bg-slate-100/85 text-slate-700",
  Soumis: "border-blue-200/80 bg-blue-50/85 text-blue-700",
  Valide: "border-emerald-200/80 bg-emerald-50/85 text-emerald-700",
  Retourne: "border-orange-200/80 bg-orange-50/85 text-orange-700",
  Depose: "border-slate-200/85 bg-slate-100/85 text-slate-700",
  "En verification": "border-blue-200/80 bg-blue-50/85 text-blue-700",
  Rejete: "border-rose-200/80 bg-rose-50/85 text-rose-700",
  "Depot manuel": "border-slate-200/85 bg-slate-100/85 text-slate-700",
  Genere: "border-indigo-200/80 bg-indigo-50/85 text-indigo-700",
  "Non preparee": "border-slate-200/85 bg-slate-100/85 text-slate-700",
  "Pret a signer": "border-amber-200/80 bg-amber-50/85 text-amber-700",
  Signe: "border-emerald-200/80 bg-emerald-50/85 text-emerald-700",
  "Echec signature": "border-rose-200/80 bg-rose-50/85 text-rose-700",
  "Synchro OK": "border-emerald-200/80 bg-emerald-50/85 text-emerald-700",
  "Quota GitHub": "border-amber-200/80 bg-amber-50/85 text-amber-700",
  "Erreur sync": "border-rose-200/80 bg-rose-50/85 text-rose-700",
  "Jamais synchronise": "border-slate-200/85 bg-slate-100/85 text-slate-700",
  "Non lue": "border-blue-200/80 bg-blue-50/85 text-blue-700",
  Lue: "border-slate-200/85 bg-slate-100/85 text-slate-700",
  Active: "border-emerald-200/80 bg-emerald-50/85 text-emerald-700",
  Desactive: "border-zinc-200/80 bg-zinc-100/85 text-zinc-700",
  Stable: "border-emerald-200/80 bg-emerald-50/85 text-emerald-700",
  "A surveiller": "border-amber-200/80 bg-amber-50/85 text-amber-700",
  Critique: "border-rose-200/80 bg-rose-50/85 text-rose-700",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.08em] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        statusClassName[status] ?? "border-slate-200/85 bg-slate-100/85 text-slate-700",
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}
