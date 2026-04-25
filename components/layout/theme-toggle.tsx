"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MaterialSymbol } from "@/components/ui/material-symbol";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isDarkTheme = mounted ? resolvedTheme === "dark" : false;
  const currentThemeLabel = isDarkTheme ? "Sombre" : "Clair";
  const nextThemeLabel = isDarkTheme ? "clair" : "sombre";

  function handleToggle() {
    setTheme(isDarkTheme ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-surface-container-low px-3 py-2 text-on-surface shadow-[var(--shadow-soft)] transition hover:bg-surface-container-high hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:px-4"
      aria-label={`Passer au theme ${nextThemeLabel}`}
      title={`Passer au theme ${nextThemeLabel}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] bg-surface-container-lowest text-primary">
        <MaterialSymbol
          icon={mounted ? (isDarkTheme ? "dark_mode" : "light_mode") : "contrast"}
          className="text-[18px]"
        />
      </span>
      <span className="hidden text-sm font-semibold sm:inline">Theme {currentThemeLabel}</span>
    </button>
  );
}
