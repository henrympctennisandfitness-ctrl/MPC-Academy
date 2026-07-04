"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui";
import type { ShotRating } from "../data";

interface ProgressSummaryProps {
  overall: number;
  ratings: ShotRating[];
}

/** Overall rating readout plus per-shot bars that fill on scroll into view. */
export function ProgressSummary({ overall, ratings }: ProgressSummaryProps) {
  const reduce = useReducedMotion();

  return (
    <Card className="p-5">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
            Overall rating
          </p>
          <p className="mt-1 text-[40px] font-bold leading-none tabular-nums">
            {overall}
            <span className="ml-1 text-[15px] font-medium text-muted">/ 100</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {ratings.map((shot, i) => (
          <div key={shot.key}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[14px] font-semibold">{shot.label}</span>
              <span className="text-[14px] font-bold tabular-nums">
                {shot.value}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: reduce ? `${shot.value}%` : 0 }}
                whileInView={{ width: `${shot.value}%` }}
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
    </Card>
  );
}
