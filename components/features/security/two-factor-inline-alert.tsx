"use client";

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
      className="flex h-11 max-h-11 items-center gap-3 overflow-hidden rounded-r-[18px] bg-[#FFF3E0] px-3 text-[#E65100] shadow-[var(--shadow-soft)]"
      style={{ borderLeft: "3px solid #FF9800" }}
    >
      <MaterialSymbol icon="warning" className="shrink-0 text-[18px]" filled />
      <p className="min-w-0 truncate text-sm font-medium">
        Activez le 2FA pour securiser votre compte
      </p>
      <button
        type="button"
        aria-label="Fermer l alerte 2FA"
        onClick={handleDismiss}
        className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#E65100] transition hover:bg-[#FFE0B2]"
      >
        <span className="text-lg leading-none">&times;</span>
      </button>
    </div>
  );
}
