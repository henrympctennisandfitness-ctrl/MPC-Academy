"use client";

import { motion } from "framer-motion";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionButtonProps {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
}

/**
 * A single choice in the Type / Goal steps. Large tap target, icon tile,
 * spring-animated selection ring, and a check that pops in when chosen.
 */
export function OptionButton({
  label,
  icon: Icon,
  selected,
  onSelect,
}: OptionButtonProps) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative flex items-center gap-3.5 rounded-2xl border bg-surface p-4 text-left",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        selected
          ? "border-brand shadow-card-hover"
          : "border-line shadow-card hover:border-[#cfd6d3]",
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors duration-200",
          selected
            ? "bg-brand text-white"
            : "bg-brand-tint text-brand group-hover:bg-[#e0ebe6]",
        )}
      >
        <Icon size={20} />
      </span>

      <span className="min-w-0 flex-1 text-[15px] font-semibold leading-tight">
        {label}
      </span>

      {/* Selection check */}
      <span
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all duration-200",
          selected ? "scale-100 bg-brand opacity-100" : "scale-75 opacity-0",
        )}
      >
        <Check size={14} className="text-white" strokeWidth={3} />
      </span>
    </motion.button>
  );
}
