import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative min-w-0 rounded-[30px] border border-border/80 bg-linear-to-br from-card via-card to-surface p-5 shadow-[var(--shadow-card)] ring-1 ring-white/20 transition-[transform,box-shadow,border-color] before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-primary/35 before:to-transparent before:content-[''] supports-[backdrop-filter]:backdrop-blur-md sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
