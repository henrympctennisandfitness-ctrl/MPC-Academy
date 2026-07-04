"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GOALS } from "../data";

/** Current goals, each with an animated progress bar. */
export function GoalsList() {
  const reduce = useReducedMotion();

  return (
    <div className="space-y-4">
      {GOALS.map((goal, i) => (
        <div key={goal.id}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-semibold">{goal.title}</p>
              <p className="truncate text-[13px] text-muted">{goal.detail}</p>
            </div>
            <span className="text-[13.5px] font-semibold tabular-nums text-muted">
              {goal.progress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: reduce ? `${goal.progress}%` : 0 }}
              whileInView={{ width: `${goal.progress}%` }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.9,
                delay: i * 0.08,
                ease: [0.2, 0.7, 0.2, 1],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
