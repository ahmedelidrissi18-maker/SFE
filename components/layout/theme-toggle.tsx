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
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors"
      aria-label={`Passer au theme ${nextThemeLabel}`}
      title={`Passer au theme ${nextThemeLabel}`}
    >
      <MaterialSymbol
        icon={mounted ? (isDarkTheme ? "dark_mode" : "light_mode") : "contrast"}
        className="text-[20px]"
      />
    </button>
  );
}
