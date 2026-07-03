"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * A premium, self-drawing success mark: a ring sweeps in, the tick draws
 * itself, and a soft halo pulses out once. Purely decorative.
 */
export function SuccessCheck() {
  const reduce = useReducedMotion();

  return (
    <div className="relative grid place-items-center">
      {/* Soft halo */}
      {!reduce && (
        <motion.span
          className="absolute h-24 w-24 rounded-full bg-brand/15"
          initial={{ scale: 0.6, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
        />
      )}

      <motion.div
        className="grid h-24 w-24 place-items-center rounded-full bg-brand-tint"
        initial={{ scale: reduce ? 1 : 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 18 }}
      >
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden>
          <motion.circle
            cx="26"
            cy="26"
            r="23"
            stroke="#0E4D3A"
            strokeWidth="2.5"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M16 27l7 7 13-14"
            stroke="#0E4D3A"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.35 }}
          />
        </svg>
      </motion.div>
    </div>
  );
}
