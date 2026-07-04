"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui";
import { getCurrentMemberProfile } from "../data";
import { ProfileHeader } from "./ProfileHeader";

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

/** The signed-in member's own profile — identity only, never anyone else's. */
export function MemberProfile() {
  const member = getCurrentMemberProfile();

  return (
    <div className="space-y-8">
      <Section delay={0.03}>
        <ProfileHeader member={member} />
      </Section>

      {/* Coaching data is live on My Progress — no fabricated history here. */}
      <Section delay={0.06}>
        <Link href="/progress" className="block">
          <Card className="flex items-center gap-4 p-5 transition-shadow duration-200 hover:shadow-card-hover">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-tint">
              <TrendingUp size={19} className="text-brand" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">Coaching feedback &amp; history</p>
              <p className="mt-0.5 text-[13.5px] text-muted">
                See your latest feedback, notes and progress ratings.
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-muted" />
          </Card>
        </Link>
      </Section>
    </div>
  );
}
