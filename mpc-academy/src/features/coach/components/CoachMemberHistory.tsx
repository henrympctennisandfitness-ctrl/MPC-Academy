"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Quote, Inbox } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useCoach } from "../store";
import { StatusPill } from "./StatusPill";

/**
 * Coach-facing profile/history for a single member. Shows every submission that
 * member has made (live from the coach store), deduplicated to this one person
 * via their stable `memberKey` (see adapters). Members never see this page.
 */
export function CoachMemberHistory({ memberKey }: { memberKey: string }) {
  const { submissions, loading, error } = useCoach();

  const mine = submissions
    .filter((s) => s.member.id === memberKey)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const member = mine[0]?.member;

  const backLink = (
    <Link href="/coach/members">
      <Button variant="ghost" size="sm">
        <ChevronLeft size={16} />
        All members
      </Button>
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {backLink}
        <div className="h-28 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-2xl border border-line bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-6">
        {backLink}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-background">
            <Inbox size={22} className="text-muted" />
          </span>
          <p className="text-[15px] font-semibold">
            {error ? "Couldn't load this member" : "Member not found"}
          </p>
          <p className="mt-1 text-[13.5px] text-muted">
            {error ?? "They may not have any submissions yet."}
          </p>
        </div>
      </div>
    );
  }

  const completed = mine.filter((s) => s.status === "Completed").length;

  return (
    <div className="space-y-6">
      {backLink}

      {/* Identity */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-tint text-[16px] font-semibold text-brand">
            {member.initials}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-bold leading-tight tracking-tight">
              {member.name}
            </h1>
            <p className="mt-0.5 truncate text-[13.5px] text-muted">
              {member.membershipId} · Academy Member
            </p>
          </div>
          <StatusPill status={member.latestStatus} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <div className="rounded-xl bg-background px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
              Submissions
            </p>
            <p className="mt-0.5 text-[15px] font-semibold tabular-nums">
              {mine.length}
            </p>
          </div>
          <div className="rounded-xl bg-background px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
              Completed
            </p>
            <p className="mt-0.5 text-[15px] font-semibold tabular-nums">
              {completed}
            </p>
          </div>
          <div className="rounded-xl bg-background px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
              Latest
            </p>
            <p className="mt-0.5 truncate text-[15px] font-semibold">
              {member.latestDateLabel}
            </p>
          </div>
        </div>
      </Card>

      {/* Submission history */}
      <div>
        <h2 className="mb-3 text-[17px] font-semibold tracking-tight">
          Submission history
        </h2>
        <div className="grid gap-3">
          {mine.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.25 }}
            >
              <Card className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold">{s.analysisType}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
                      <span className="rounded-md bg-background px-2 py-0.5 font-medium text-ink">
                        {s.goal}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{s.dateLabel}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {s.progressRating !== null &&
                      s.progressRating !== undefined && (
                        <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[12.5px] font-bold tabular-nums text-brand">
                          {s.progressRating}
                        </span>
                      )}
                    <StatusPill status={s.status} />
                  </div>
                </div>

                {s.notes && (
                  <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                    {s.notes}
                  </p>
                )}

                {s.feedback && (
                  <div className="mt-3 flex gap-2 rounded-xl bg-background px-3.5 py-3">
                    <Quote size={15} className="mt-0.5 shrink-0 text-brand/60" />
                    <p className="text-[13.5px] leading-relaxed text-ink">
                      {s.feedback}
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
