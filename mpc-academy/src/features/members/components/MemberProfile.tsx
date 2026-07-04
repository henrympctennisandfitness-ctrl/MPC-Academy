"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { getMemberBySlug } from "../data";
import { ProfileHeader } from "./ProfileHeader";
import { ProgressSummary } from "./ProgressSummary";
import { GoalsList } from "./GoalsList";
import { ReviewsTimeline } from "./ReviewsTimeline";
import { CoachNote } from "./CoachNote";
import { Achievements } from "./Achievements";

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

/** Full member profile. Looks the member up client-side from its slug. */
export function MemberProfile({
  slug,
  backHref,
  backLabel = "All members",
}: {
  slug: string;
  /** When set, shows a back link (e.g. to the coach roster). Own-profile omits it. */
  backHref?: string;
  backLabel?: string;
}) {
  const member = getMemberBySlug(slug);
  if (!member) return null; // the route already guards unknown slugs

  return (
    <div className="space-y-8">
      {backHref && (
        <Section>
          <Link href={backHref}>
            <Button variant="ghost" size="sm">
              <ChevronLeft size={16} />
              {backLabel}
            </Button>
          </Link>
        </Section>
      )}

      <Section delay={0.03}>
        <ProfileHeader member={member} />
      </Section>

      <Section delay={0.06}>
        <SectionHeading title="Progress summary" />
        <ProgressSummary overall={member.overall} ratings={member.ratings} />
      </Section>

      <Section delay={0.08}>
        <SectionHeading title="Current goals" />
        <GoalsList goals={member.goals} />
      </Section>

      <Section delay={0.1}>
        <SectionHeading title="Recent coaching reviews" />
        <ReviewsTimeline reviews={member.reviews} />
      </Section>

      <Section delay={0.12}>
        <SectionHeading title="Coach notes" />
        <CoachNote note={member.coachNote} />
      </Section>

      <Section delay={0.14}>
        <SectionHeading title="Achievements" />
        <Achievements items={member.achievements} />
      </Section>
    </div>
  );
}
