"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Quote, MessageSquareText, AlertCircle } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { useMemberProgress } from "../store";
import { SessionTimeline } from "./SessionTimeline";

/** Fade-up wrapper for each stacked section. */
function Section({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.section>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="mb-3 text-[17px] font-semibold tracking-tight">{title}</h2>;
}

/** Premium empty state — shown when the member has no live feedback yet. */
function EmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-tint">
        <MessageSquareText size={24} className="text-brand" />
      </span>
      <p className="text-[16px] font-semibold">No coaching feedback yet.</p>
      <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-muted">
        Submit an analysis and your coach&apos;s feedback, ratings and notes will
        appear here.
      </p>
      <Link href="/submit" className="mt-6">
        <Button size="sm">Submit an analysis</Button>
      </Link>
    </Card>
  );
}

/**
 * My Progress — driven ENTIRELY by live Google Sheets data for the signed-in
 * member (via useMemberProgress). No mock/aggregate data: when there is no
 * feedback yet, a premium empty state is shown instead of fake sessions.
 */
export function ProgressView() {
  const { sessions, latestFeedback, loading, error } = useMemberProgress();
  const hasData = sessions.length > 0;

  return (
    <div className="space-y-8">
      {/* Heading */}
      <Section>
        <h1 className="text-[26px] font-bold tracking-tight">My progress</h1>
        <p className="mt-1 text-[15px] text-muted">
          Your coaching feedback and history, straight from your coach.
        </p>
      </Section>

      {loading ? (
        <Section delay={0.05}>
          <div className="grid gap-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[116px] animate-pulse rounded-2xl border border-line bg-surface"
              />
            ))}
          </div>
        </Section>
      ) : error ? (
        <Section delay={0.05}>
          <Card className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <AlertCircle size={22} className="text-muted" />
            <p className="mt-3 text-[15px] font-semibold">
              Couldn&apos;t load your progress
            </p>
            <p className="mt-1 text-[13.5px] text-muted">{error}</p>
          </Card>
        </Section>
      ) : !hasData ? (
        <Section delay={0.05}>
          <EmptyState />
        </Section>
      ) : (
        <>
          {/* Latest coach feedback */}
          {latestFeedback && (
            <Section delay={0.05}>
              <SectionHeading title="Latest coach feedback" />
              <Card className="p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold">
                      {latestFeedback.analysisType}
                    </p>
                    <p className="text-[13px] text-muted">
                      {latestFeedback.date} · {latestFeedback.coach}
                    </p>
                  </div>
                  {latestFeedback.rating !== null && (
                    <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-1 text-[12.5px] font-bold tabular-nums text-brand">
                      {latestFeedback.rating}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 rounded-xl bg-background px-3.5 py-3">
                  <Quote size={16} className="mt-0.5 shrink-0 text-brand/60" />
                  <p className="text-[14px] leading-relaxed text-ink">
                    {latestFeedback.comment}
                  </p>
                </div>
                {latestFeedback.coachNotes && (
                  <div className="mt-2 rounded-xl border border-dashed border-line px-3.5 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
                      Coach notes
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">
                      {latestFeedback.coachNotes}
                    </p>
                  </div>
                )}
              </Card>
            </Section>
          )}

          {/* Coaching history */}
          <Section delay={0.08}>
            <SectionHeading title="Coaching history" />
            <SessionTimeline sessions={sessions} />
          </Section>
        </>
      )}

      {/* CTA */}
      <Section delay={0.12}>
        <Link href="/submit" className="block">
          <Button className="w-full sm:w-auto">Submit new analysis</Button>
        </Link>
      </Section>
    </div>
  );
}
