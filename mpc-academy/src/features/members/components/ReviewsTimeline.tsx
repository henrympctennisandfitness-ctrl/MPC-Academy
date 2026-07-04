"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import type { ProfileReview } from "../data";

/** Vertical timeline of recent coaching reviews. */
export function ReviewsTimeline({ reviews }: { reviews: ProfileReview[] }) {
  return (
    <div>
      {reviews.map((r, i) => {
        const last = i === reviews.length - 1;
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: Math.min(i * 0.06, 0.3), duration: 0.35 }}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <span className="mt-1 h-3 w-3 rounded-full bg-brand ring-4 ring-brand-tint" />
              {!last && <span className="w-px flex-1 bg-line" />}
            </div>

            <div className={last ? "flex-1" : "flex-1 pb-6"}>
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold">{r.analysisType}</p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {r.date} · {r.coach}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-1 text-[12.5px] font-bold tabular-nums text-brand">
                    {r.rating}
                  </span>
                </div>

                <div className="mt-3 flex gap-2 rounded-xl bg-background px-3.5 py-3">
                  <Quote size={15} className="mt-0.5 shrink-0 text-brand/60" />
                  <p className="text-[13.5px] leading-relaxed text-ink">
                    {r.comment}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
