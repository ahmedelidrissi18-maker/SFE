import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <Card className="overflow-hidden bg-linear-to-br from-background via-card to-accent/40 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-sm leading-6 text-muted">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
