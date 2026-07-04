"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileAchievement } from "../data";

/** Achievements grid — earned tiles lit, locked ones muted. */
export function Achievements({ items }: { items: ProfileAchievement[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className={cn(
            "rounded-2xl border p-4 text-center",
            a.earned
              ? "border-line bg-surface shadow-card"
              : "border-dashed border-line bg-background",
          )}
        >
          <span
            className={cn(
              "mx-auto grid h-11 w-11 place-items-center rounded-xl",
              a.earned ? "bg-brand-tint" : "bg-line/60",
            )}
          >
            {a.earned ? (
              <a.icon size={20} className="text-brand" />
            ) : (
              <Lock size={18} className="text-muted" />
            )}
          </span>
          <p
            className={cn(
              "mt-2.5 text-[13.5px] font-semibold leading-tight",
              !a.earned && "text-muted",
            )}
          >
            {a.title}
          </p>
          <p className="mt-1 text-[11.5px] leading-snug text-muted">
            {a.earned ? a.date : a.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
