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
  titleClassName?: string;
  descriptionClassName?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  contentClassName,
  actionsClassName,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card px-4 py-5 shadow-[var(--shadow-card)] sm:px-6 sm:py-6",
        className,
      )}
    >
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className={cn("min-w-0 flex-1 space-y-3", contentClassName)}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h1
            className={cn(
              "break-words text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl",
              titleClassName,
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              "max-w-3xl text-sm leading-7 text-on-surface-variant sm:text-[15px]",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        </div>
        {actions ? (
          <div
            className={cn(
              "flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-start lg:justify-end",
              "[&_a]:w-full [&_button]:w-full sm:[&_a]:w-auto sm:[&_button]:w-auto",
              "[&_a]:sm:min-w-[10rem] [&_button]:sm:min-w-[10rem]",
              "[&_a]:justify-center [&_button]:justify-center [&_a]:sm:shrink-0 [&_a]:sm:whitespace-nowrap [&_button]:sm:shrink-0 [&_button]:sm:whitespace-nowrap",
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
