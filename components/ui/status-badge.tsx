import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
};

const statusClassName: Record<string, string> = {
  "En cours": "bg-secondary-fixed text-on-secondary-fixed",
  Planifie: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  Termine: "bg-surface-container-high text-on-surface-variant",
  Suspendu: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  Annule: "bg-error-container text-on-error-container",
  "Aucun stage": "bg-surface-container-high text-on-surface-variant",
  Actif: "bg-secondary-fixed text-on-secondary-fixed",
  Archive: "bg-surface-container-high text-on-surface-variant",
  Brouillon: "bg-surface-container-high text-on-surface-variant",
  Soumis: "bg-primary-fixed text-on-primary-fixed-variant",
  Valide: "bg-secondary-fixed text-on-secondary-fixed",
  Retourne: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  Depose: "bg-surface-container-high text-on-surface-variant",
  "En verification": "bg-primary-fixed text-on-primary-fixed-variant",
  Rejete: "bg-error-container text-on-error-container",
  "Depot manuel": "bg-surface-container-high text-on-surface-variant",
  Genere: "bg-primary-fixed text-on-primary-fixed-variant",
  "Non preparee": "bg-surface-container-high text-on-surface-variant",
  "Pret a signer": "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  Signe: "bg-secondary-fixed text-on-secondary-fixed",
  "Echec signature": "bg-error-container text-on-error-container",
  "Synchro OK": "bg-secondary-fixed text-on-secondary-fixed",
  "Quota GitHub": "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  "Erreur sync": "bg-error-container text-on-error-container",
  "Jamais synchronise": "bg-surface-container-high text-on-surface-variant",
  "Non lue": "bg-primary-fixed text-on-primary-fixed-variant",
  Lue: "bg-surface-container-high text-on-surface-variant",
  Active: "bg-secondary-fixed text-on-secondary-fixed",
  Desactive: "bg-surface-container-high text-on-surface-variant",
  Stable: "bg-secondary-fixed text-on-secondary-fixed",
  "A surveiller": "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  Critique: "bg-error-container text-on-error-container",
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
