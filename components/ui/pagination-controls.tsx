import Link from "next/link";
import { buildPaginationHref } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type SearchParamValue = string | string[] | undefined;

type PaginationControlsProps = {
  pathname: string;
  searchParams: Record<string, SearchParamValue>;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startItem: number;
  endItem: number;
  itemLabel: string;
  className?: string;
};

function getButtonClassName(isDisabled: boolean) {
  return cn(
    "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] transition",
    isDisabled
      ? "cursor-not-allowed bg-surface-container-low text-on-surface-variant/60"
      : "bg-surface-container-low text-on-surface hover:bg-surface-container-high hover:text-primary",
  );
}

export function PaginationControls({
  pathname,
  searchParams,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  startItem,
  endItem,
  itemLabel,
  className,
}: PaginationControlsProps) {
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  const previousHref = buildPaginationHref(pathname, searchParams, currentPage - 1);
  const nextHref = buildPaginationHref(pathname, searchParams, currentPage + 1);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[24px] bg-card p-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="text-sm text-on-surface-variant">
        {startItem}-{endItem} sur {totalItems} {itemLabel}
        <span className="ml-2">Page {currentPage} / {totalPages}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {currentPage > 1 ? (
          <Link href={previousHref} className={getButtonClassName(false)}>
            Precedent
          </Link>
        ) : (
          <span className={getButtonClassName(true)}>Precedent</span>
        )}

        {currentPage < totalPages ? (
          <Link href={nextHref} className={getButtonClassName(false)}>
            Suivant
          </Link>
        ) : (
          <span className={getButtonClassName(true)}>Suivant</span>
        )}

        <span className="text-xs text-on-surface-variant">
          {pageSize} elements max par page
        </span>
      </div>
    </div>
  );
}
