import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackBannerProps = {
  kind?: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: LucideIcon;
  className?: string;
};

const styles = {
  success: {
    container: "border-emerald-200/80 bg-linear-to-br from-emerald-50 to-card text-emerald-900",
    icon: "bg-emerald-600 text-white",
    action: "hover:bg-emerald-100/80",
  },
  error: {
    container: "border-red-200/80 bg-linear-to-br from-red-50 to-card text-red-900",
    icon: "bg-red-600 text-white",
    action: "hover:bg-red-100/80",
  },
  info: {
    container: "border-sky-200/80 bg-linear-to-br from-sky-50 to-card text-sky-900",
    icon: "bg-sky-600 text-white",
    action: "hover:bg-sky-100/80",
  },
  warning: {
    container: "border-amber-200/80 bg-linear-to-br from-amber-50 to-card text-amber-900",
    icon: "bg-amber-600 text-white",
    action: "hover:bg-amber-100/80",
  },
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: TriangleAlert,
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
  const Icon = icon ?? icons[kind];
  const style = styles[kind];

  return (
    <div
      role={kind === "error" || kind === "warning" ? "alert" : "status"}
      className={cn(
        "rounded-[26px] border px-4 py-4 shadow-[var(--shadow-soft)] sm:px-5",
        style.container,
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] shadow-[0_18px_34px_-24px_rgba(15,23,42,0.45)]",
              style.icon,
            )}
          >
            <Icon className="h-5 w-5" />
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
              "inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-current/15 bg-white/60 px-4 py-2 text-sm font-semibold shadow-[0_16px_30px_-24px_rgba(15,23,42,0.32)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/25 focus-visible:ring-offset-2",
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
