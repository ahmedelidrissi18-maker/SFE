import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type MaterialSymbolProps = {
  icon: string;
  className?: string;
  filled?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  grade?: number;
  opticalSize?: number;
  title?: string;
  "aria-hidden"?: boolean;
};

export function MaterialSymbol({
  icon,
  className,
  filled = false,
  weight = 400,
  grade = 0,
  opticalSize = 24,
  title,
  "aria-hidden": ariaHidden,
}: MaterialSymbolProps) {
  const style = {
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
  } satisfies CSSProperties;

  return (
    <span
      title={title}
      aria-hidden={ariaHidden ?? true}
      className={cn("material-symbols-outlined select-none leading-none", className)}
      style={style}
    >
      {icon}
    </span>
  );
}
