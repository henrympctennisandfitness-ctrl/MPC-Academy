import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a gentle lift + shadow on hover. Use for tappable cards. */
  interactive?: boolean;
}

/** Soft, rounded surface with a hairline border and subtle elevation. */
export function Card({ interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-card",
        interactive &&
          "cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover",
        className,
      )}
      {...props}
    />
  );
}
