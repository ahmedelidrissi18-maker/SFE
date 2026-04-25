"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";

type TwoFactorInlineAlertProps = {
  userId: string;
};

export function TwoFactorInlineAlert({ userId }: TwoFactorInlineAlertProps) {
  const [isDismissedInSession, setIsDismissedInSession] = useState(false);
  const storageKey = useMemo(() => `dashboard-two-factor-inline-dismissed:${userId}`, [userId]);
  const isDismissedPersisted = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return window.localStorage.getItem(storageKey) === "true";
      } catch {
        return false;
      }
    },
    () => false,
  );

  function handleDismiss() {
    try {
      window.localStorage.setItem(storageKey, "true");
    } catch {
      // Ignore storage failures and still hide locally.
    }

    setIsDismissedInSession(true);
  }

  if (isDismissedInSession || isDismissedPersisted) {
    return null;
  }

  return (
    <div
      className="flex max-w-full items-center justify-between gap-3 rounded-[20px] border border-tertiary-fixed-dim/50 bg-tertiary-fixed px-4 py-3 text-on-tertiary-fixed-variant shadow-[var(--shadow-soft)]"
      role="alert"
    >
      <div className="flex min-w-0 items-center gap-3">
        <MaterialSymbol icon="warning" className="shrink-0 text-[18px]" filled />
        <p className="min-w-0 text-sm font-medium">
          Activez le 2FA pour sécuriser votre compte.
        </p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          href="/securite"
          className="inline-flex h-9 items-center justify-center rounded-full bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)] transition hover:bg-surface-container-high"
        >
          Activer maintenant
        </Link>
        <button
          type="button"
          aria-label="Fermer l’alerte 2FA"
          onClick={handleDismiss}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-tertiary-fixed-variant transition hover:bg-white/15"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>
      </div>
    </div>
  );
}
