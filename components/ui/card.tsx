import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative min-w-0 rounded-[28px] bg-card p-5 shadow-[var(--shadow-card)] transition-[transform,box-shadow,background-color] sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
