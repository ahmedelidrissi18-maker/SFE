import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  actionsClassName?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  contentClassName,
  actionsClassName,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-border/80 bg-linear-to-br from-card via-card to-surface px-6 py-6 shadow-[var(--shadow-card)]",
        "before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-primary/45 before:to-transparent before:content-['']",
        className,
      )}
    >
      <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-4rem] left-[-3rem] h-32 w-32 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className={cn("space-y-3", contentClassName)}>
          <p className="inline-flex w-fit items-center rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-muted sm:text-[15px]">{description}</p>
        </div>
        {actions ? (
          <div
            className={cn(
              "flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-start lg:justify-end",
              "[&_a]:shadow-[0_18px_36px_-28px_rgba(15,118,110,0.45)] [&_a]:transition [&_a]:hover:-translate-y-0.5 [&_a]:focus-visible:ring-offset-card [&_a]:sm:min-w-[11rem]",
              "[&_button]:shadow-[0_18px_36px_-28px_rgba(15,118,110,0.45)] [&_button]:transition [&_button]:hover:-translate-y-0.5 [&_button]:focus-visible:ring-offset-card [&_button]:sm:min-w-[11rem]",
              actionsClassName,
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
