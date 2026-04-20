import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type FeedbackBannerProps = {
  kind?: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: string;
  className?: string;
};

const styles = {
  success: {
    container: "bg-secondary-fixed text-on-secondary-fixed",
    icon: "bg-white/70 text-on-secondary-fixed",
    action: "text-on-secondary-fixed",
  },
  error: {
    container: "bg-error-container text-on-error-container",
    icon: "bg-white/70 text-on-error-container",
    action: "text-on-error-container",
  },
  info: {
    container: "bg-primary-fixed text-on-primary-fixed-variant",
    icon: "bg-white/70 text-on-primary-fixed-variant",
    action: "text-on-primary-fixed-variant",
  },
  warning: {
    container: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    icon: "bg-white/70 text-on-tertiary-fixed-variant",
    action: "text-on-tertiary-fixed-variant",
  },
};

const icons = {
  success: "task_alt",
  error: "error",
  info: "info",
  warning: "warning",
};

export function FeedbackBanner({
  kind = "success",
  title,
  message,
  description,
  actionLabel,
  actionHref,
  icon,
  className,
}: FeedbackBannerProps) {
  const glyph = icon ?? icons[kind];
  const style = styles[kind];

  return (
    <div
      role={kind === "error" || kind === "warning" ? "alert" : "status"}
      className={cn(
        "rounded-[26px] px-4 py-4 shadow-[var(--shadow-soft)] sm:px-5",
        style.container,
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px]",
              style.icon,
            )}
          >
            <MaterialSymbol icon={glyph} className="text-[20px]" filled />
          </div>
          <div className="space-y-1">
            {title ? <p className="text-sm font-semibold tracking-tight">{title}</p> : null}
            <p className="text-sm leading-6">{message}</p>
            {description ? <p className="text-sm leading-6 opacity-80">{description}</p> : null}
          </div>
        </div>

        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-white/70 px-4 py-2 text-sm font-semibold shadow-[0px_12px_32px_rgba(26,28,29,0.04)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/20 focus-visible:ring-offset-2",
              style.action,
            )}
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
