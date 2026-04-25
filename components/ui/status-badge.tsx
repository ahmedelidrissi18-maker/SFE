import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
};

const statusClassName: Record<string, string> = {
  "En cours": "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  "Planifié": "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  Planifie: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  Terminé: "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  Termine: "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  Suspendu: "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
  Annulé: "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
  Annule: "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
  "Aucun stage": "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  Actif: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  Archivé: "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  Archive: "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  Brouillon: "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  Soumis: "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
  Validé: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  Valide: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  Retourné: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  Retourne: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  Déposé: "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  Depose: "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  "En vérification": "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
  "En verification": "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
  Rejeté: "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
  Rejete: "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
  "Depot manuel": "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  Généré: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  Genere: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  "Non préparée": "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  "Non preparee": "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  "Prêt à signer": "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  "Pret a signer": "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  Signé: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  Signe: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  "Échec signature": "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
  "Echec signature": "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
  "Synchro OK": "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  "Quota GitHub": "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  "Erreur sync": "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
  "Jamais synchronisé": "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  "Jamais synchronise": "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  "Non lue": "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
  Lue: "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  Active: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  Désactivé: "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  Desactive: "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
  Stable: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  "A surveiller": "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  Critique: "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-[0.08em]",
        statusClassName[status] ?? "bg-surface-container-high text-on-surface-variant",
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}
