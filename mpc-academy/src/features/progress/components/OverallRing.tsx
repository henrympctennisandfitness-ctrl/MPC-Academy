"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface OverallRingProps {
  value: number; // 0–100
  delta: number;
  label: string;
}

/** Large radial progress ring — the hero metric, WHOOP-style. */
export function OverallRing({ value, delta, label }: OverallRingProps) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <div className="relative grid h-44 w-44 shrink-0 place-items-center">
        <svg viewBox="0 0 120 120" className="h-44 w-44 -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#ECECEC"
            strokeWidth="10"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#0E4D3A"
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ pathLength: reduce ? pct / 100 : 0 }}
            animate={{ pathLength: pct / 100 }}
            transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
          />
        </svg>

        {/* Centre readout */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <motion.span
              className="block text-[44px] font-bold leading-none tabular-nums"
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {pct}
            </motion.span>
            <span className="mt-1 block text-[12px] font-medium text-muted">
              out of 100
            </span>
          </div>
        </div>
      </div>

      <div className="text-center sm:text-left">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">
          {label}
        </p>
        <p className="mt-1 text-[18px] font-semibold">You&apos;re trending up</p>
        <p className="mt-1 max-w-xs text-[14px] leading-relaxed text-muted">
          Your all-round game has improved steadily across the last five reviews.
        </p>
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-1 text-[12.5px] font-semibold text-brand">
          <ArrowUpRight size={14} />
          {delta > 0 ? `+${delta}` : delta} this month
        </span>
      </div>
    </div>
  );
}
