"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Quote } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { OVERALL } from "../data";
import { useMemberProgress } from "../store";
import { OverallRing } from "./OverallRing";
import { ShotRatings } from "./ShotRatings";
import { GoalsList } from "./GoalsList";
import { Achievements } from "./Achievements";
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

/** The full My Progress experience — Apple Health × WHOOP, mobile-first. */
export function ProgressView() {
  const { sessions, latestFeedback, loading, error } = useMemberProgress();

  return (
    <div className="space-y-8">
      {/* Heading */}
      <Section>
        <h1 className="text-[26px] font-bold tracking-tight">My progress</h1>
        <p className="mt-1 text-[15px] text-muted">
          How your game is trending across every review.
        </p>
      </Section>

      {/* Latest coach feedback */}
      {latestFeedback && (
        <Section delay={0.04}>
          <SectionHeading title="Latest coach feedback" />
          <Card className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[14px] font-semibold">
                {latestFeedback.analysisType}
              </p>
              <p className="text-[13px] text-muted">
                {latestFeedback.date} · {latestFeedback.coach}
              </p>
            </div>
            <div className="flex gap-2 rounded-xl bg-background px-3.5 py-3">
              <Quote size={16} className="mt-0.5 shrink-0 text-brand/60" />
              <p className="text-[14px] leading-relaxed text-ink">
                {latestFeedback.comment}
              </p>
            </div>
          </Card>
        </Section>
      )}

      {/* Overall */}
      <Section delay={0.05}>
        <Card className="p-6">
          <OverallRing
            value={OVERALL.value}
            delta={OVERALL.delta}
            label={OVERALL.label}
          />
        </Card>
      </Section>

      {/* Shot ratings */}
      <Section delay={0.1}>
        <SectionHeading title="Shot ratings" />
        <Card className="p-5">
          <ShotRatings />
        </Card>
      </Section>

      {/* Goals */}
      <Section delay={0.12}>
        <SectionHeading title="Current goals" />
        <Card className="p-5">
          <GoalsList />
        </Card>
      </Section>

      {/* Achievements */}
      <Section delay={0.14}>
        <SectionHeading title="Achievements & milestones" />
        <Achievements />
      </Section>

      {/* Coaching history */}
      <Section delay={0.16}>
        <SectionHeading title="Coaching history" />
        <SessionTimeline sessions={sessions} loading={loading} error={error} />
      </Section>

      {/* CTA */}
      <Section delay={0.18}>
        <Link href="/submit" className="block">
          <Button className="w-full sm:w-auto">Submit new analysis</Button>
        </Link>
      </Section>
    </div>
  );
}
