"use client";

import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type SessionDropdownProps = {
  displayName: string;
  email: string;
  roleLabel: string;
  currentDateLabel: string;
  initials: string;
};

export function SessionDropdown({
  displayName,
  email,
  roleLabel,
  currentDateLabel,
  initials,
}: SessionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current) {
        return;
      }

      const target = event.target;

      if (target instanceof Node && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative z-30 w-full sm:w-auto">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-2 rounded-lg p-1.5 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col items-start text-left">
          <span className="max-w-[120px] truncate leading-none text-foreground">{displayName}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{roleLabel}</span>
        </div>
        <MaterialSymbol
          icon={isOpen ? "expand_less" : "expand_more"}
          className="hidden sm:block shrink-0 text-[18px] text-muted-foreground"
        />
      </button>

      <div
        className={cn(
          "absolute right-0 top-[calc(100%+0.75rem)] z-40 w-[calc(100vw-2.5rem)] max-w-[22rem] rounded-[24px] bg-surface-container-low p-4 shadow-[var(--shadow-card)] sm:w-[22rem]",
          isOpen ? "block" : "hidden",
        )}
        role="menu"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-primary text-sm font-semibold text-on-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-on-surface">{displayName}</p>
            <p className="truncate text-sm text-on-surface-variant">{email}</p>
          </div>
        </div>

        <div className="mt-4 rounded-[18px] bg-surface-container-lowest px-3 py-3 text-sm shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="font-medium text-on-surface">{roleLabel}</span>
            <span className="text-on-surface-variant">{currentDateLabel}</span>
          </div>
        </div>

        <div className="soft-rule my-4" />

        <LogoutButton
          formClassName="w-full"
          className="w-full justify-center rounded-[18px] bg-surface-container-lowest px-4 py-3 shadow-[var(--shadow-soft)] hover:bg-surface-container-high"
        />
      </div>
    </div>
  );
}
