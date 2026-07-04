"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { SHOT_RATINGS } from "../data";

/** Serve / Forehand / Backhand / Volley ratings as animated bars. */
export function ShotRatings() {
  const reduce = useReducedMotion();

  return (
    <div className="space-y-5">
      {SHOT_RATINGS.map((shot, i) => {
        const up = shot.delta >= 0;
        return (
          <div key={shot.key}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[14.5px] font-semibold">{shot.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-[15px] font-bold tabular-nums">
                  {shot.value}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold"
                  style={{ color: up ? "#146C43" : "#B42318" }}
                >
                  {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(shot.delta)}
                </span>
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
        );
      })}
    </div>
  );
}
