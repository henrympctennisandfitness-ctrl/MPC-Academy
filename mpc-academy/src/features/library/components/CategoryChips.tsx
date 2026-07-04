"use client";

import { CATEGORIES } from "../data";
import { cn } from "@/lib/utils";

interface CategoryChipsProps {
  active: string; // "all" or a category slug
  onChange: (value: string) => void;
}

/** Scrollable category filter. Reuses the `.lib-rail` scrollbar-hide rule. */
export function CategoryChips({ active, onChange }: CategoryChipsProps) {
  const chips = [{ slug: "all", label: "All" }, ...CATEGORIES];

  return (
    <div className="lib-rail -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {chips.map((c) => {
        const on = active === c.slug;
        return (
          <button
            key={c.slug}
            onClick={() => onChange(c.slug)}
            aria-pressed={on}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors",
              on
                ? "border-brand bg-brand text-white"
                : "border-line bg-surface text-ink hover:border-[#cfd6d3]",
            )}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
