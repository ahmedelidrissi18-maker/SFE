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
      <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-36 w-36 rounded-full bg-primary-fixed/80 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-4rem] left-[-3rem] h-32 w-32 rounded-full bg-tertiary-fixed/70 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className={cn("space-y-3", contentClassName)}>
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
              "flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-start lg:justify-end",
              "[&_a]:sm:min-w-[11rem] [&_button]:sm:min-w-[11rem]",
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
