"use client";

import { motion } from "framer-motion";
import { Quote, Inbox, AlertCircle } from "lucide-react";
import type { MemberSession } from "../store";

interface SessionTimelineProps {
  sessions: MemberSession[];
  loading: boolean;
  error: string | null;
}

/** Vertical timeline of past coaching sessions, each with the coach's note. */
export function SessionTimeline({ sessions, loading, error }: SessionTimelineProps) {
  if (loading) {
    return (
      <div className="grid gap-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[116px] animate-pulse rounded-2xl border border-line bg-surface"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-12 text-center">
        <AlertCircle size={22} className="text-muted" />
        <p className="mt-3 text-[14px] font-semibold">Couldn&apos;t load your history</p>
        <p className="mt-1 text-[13px] text-muted">{error}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-12 text-center">
        <Inbox size={22} className="text-muted" />
        <p className="mt-3 text-[14px] font-semibold">No reviews yet</p>
        <p className="mt-1 text-[13px] text-muted">
          Submit an analysis and your coach&apos;s feedback will appear here.
        </p>
      </div>
    );
  }

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
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
