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
        "relative overflow-hidden rounded-[32px] bg-card px-6 py-6 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute right-[-5rem] top-[-4rem] h-28 w-28 rounded-full bg-primary-fixed/35 blur-[72px]" />
      <div className="pointer-events-none absolute bottom-[-5rem] left-[-4rem] h-24 w-24 rounded-full bg-tertiary-fixed/30 blur-[72px]" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className={cn("min-w-0 flex-1 space-y-3", contentClassName)}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-on-surface-variant sm:text-[15px]">
            {description}
          </p>
        </div>
        {actions ? (
          <div
            className={cn(
              "flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-start lg:justify-end",
              "[&_a]:sm:min-w-[11rem] [&_button]:sm:min-w-[11rem]",
              "[&_a]:shrink-0 [&_a]:whitespace-nowrap [&_button]:shrink-0 [&_button]:whitespace-nowrap",
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
