import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
};

const statusClassName: Record<string, string> = {
  "En cours": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Planifie: "border-amber-200 bg-amber-50 text-amber-700",
  Termine: "border-slate-200 bg-slate-100 text-slate-700",
  Suspendu: "border-orange-200 bg-orange-50 text-orange-700",
  Annule: "border-rose-200 bg-rose-50 text-rose-700",
  "Aucun stage": "border-slate-200 bg-slate-100 text-slate-700",
  Actif: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Archive: "border-zinc-200 bg-zinc-100 text-zinc-700",
  Brouillon: "border-slate-200 bg-slate-100 text-slate-700",
  Soumis: "border-blue-200 bg-blue-50 text-blue-700",
  Valide: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Retourne: "border-orange-200 bg-orange-50 text-orange-700",
  Depose: "border-slate-200 bg-slate-100 text-slate-700",
  "En verification": "border-blue-200 bg-blue-50 text-blue-700",
  Rejete: "border-rose-200 bg-rose-50 text-rose-700",
  "Depot manuel": "border-slate-200 bg-slate-100 text-slate-700",
  Genere: "border-indigo-200 bg-indigo-50 text-indigo-700",
  "Non preparee": "border-slate-200 bg-slate-100 text-slate-700",
  "Pret a signer": "border-amber-200 bg-amber-50 text-amber-700",
  Signe: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Echec signature": "border-rose-200 bg-rose-50 text-rose-700",
  "Synchro OK": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Quota GitHub": "border-amber-200 bg-amber-50 text-amber-700",
  "Erreur sync": "border-rose-200 bg-rose-50 text-rose-700",
  "Jamais synchronise": "border-slate-200 bg-slate-100 text-slate-700",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide",
        statusClassName[status] ?? "border-slate-200 bg-slate-100 text-slate-700",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
