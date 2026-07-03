"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { SuccessCheck } from "../SuccessCheck";

interface StepSuccessProps {
  /** Reset the wizard to submit another clip. */
  onRestart: () => void;
}

/** Step 6 — the payoff. Animated confirmation + clear next actions. */
export function StepSuccess({ onRestart }: StepSuccessProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <SuccessCheck />

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.35 }}
        className="mt-8 text-[26px] font-bold tracking-tight"
      >
        Submission received
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.35 }}
        className="mt-3 max-w-sm text-[15.5px] leading-relaxed text-muted"
      >
        Your clip is with your coach. We&apos;ll review your video within five
        working days and send your feedback and notes.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.35 }}
        className="mt-9 flex flex-col gap-3 sm:flex-row"
      >
        <Link href="/progress">
          <Button className="w-full sm:w-auto">View my progress</Button>
        </Link>
        <Button variant="ghost" onClick={onRestart} className="w-full sm:w-auto">
          Submit another
        </Button>
      </motion.div>
    </div>
  );
}
