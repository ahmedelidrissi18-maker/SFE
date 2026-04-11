import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-border/80 bg-card p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.28)]",
        className,
      )}
      {...props}
    />
  );
}
