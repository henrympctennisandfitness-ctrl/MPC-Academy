"use client";

import { motion } from "framer-motion";
import { STEPS, STEP_COUNT } from "../schema";

interface WizardProgressProps {
  /** Zero-based index of the current step. */
  step: number;
}

/** Slim, animated progress indicator that sits above the wizard content. */
export function WizardProgress({ step }: WizardProgressProps) {
  const current = Math.min(step, STEP_COUNT - 1);
  const pct = ((current + 1) / STEP_COUNT) * 100;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Step {current + 1} of {STEP_COUNT}
        </span>
        <span className="text-xs font-medium text-muted">
          {STEPS[current].label}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        />
      </div>
    </div>
  );
}
