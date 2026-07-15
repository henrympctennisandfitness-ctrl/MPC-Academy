"use client";

import { motion } from "framer-motion";
import { Quote, PlayCircle } from "lucide-react";
import type { MemberSession } from "../store";

/**
 * Vertical timeline of the member's completed coaching sessions — each with the
 * coach's feedback, notes, completion date and progress rating. Fed entirely by
 * live Google Sheets data; the parent gates loading/error/empty.
 */
export function SessionTimeline({ sessions }: { sessions: MemberSession[] }) {
  return (
    <div>
      {sessions.map((s, i) => {
        const last = i === sessions.length - 1;
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: Math.min(i * 0.06, 0.3), duration: 0.35 }}
            className="flex gap-4"
          >
            {/* Rail */}
            <div className="flex flex-col items-center">
              <span className="mt-1 grid h-3 w-3 place-items-center rounded-full bg-brand ring-4 ring-brand-tint" />
              {!last && <span className="w-px flex-1 bg-line" />}
            </div>

            {/* Entry */}
            <div className={last ? "flex-1" : "flex-1 pb-6"}>
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold">{s.analysisType}</p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {s.date} · {s.coach}
                    </p>
                  </div>
                  {s.rating !== null && (
                    <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-1 text-[12.5px] font-bold tabular-nums text-brand">
                      {s.rating}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2 rounded-xl bg-background px-3.5 py-3">
                  <Quote size={15} className="mt-0.5 shrink-0 text-brand/60" />
                  <p className="text-[13.5px] leading-relaxed text-ink">
                    {s.comment}
                  </p>
                </div>

                {s.coachNotes && (
                  <div className="mt-2 rounded-xl border border-dashed border-line px-3.5 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
                      Coach notes
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">
                      {s.coachNotes}
                    </p>
                  </div>
                )}

                {s.videoUrl && (
                  <a
                    href={s.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:underline"
                  >
                    <PlayCircle size={15} />
                    View your video
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
