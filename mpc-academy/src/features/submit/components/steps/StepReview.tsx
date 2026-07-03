"use client";

import { motion } from "framer-motion";
import {
  Target,
  Crosshair,
  Video,
  MessageSquareText,
  Pencil,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui";
import { formatBytes, type WizardData } from "../../schema";
import { StepHeader } from "../StepHeader";

interface StepReviewProps {
  data: WizardData;
  /** Jump back to a specific step index to edit. */
  onEdit: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  /** Real upload progress 0–100 while submitting. */
  progress: number;
}

interface SummaryRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onEdit: () => void;
  muted?: boolean;
}

function SummaryRow({ icon: Icon, label, value, onEdit, muted }: SummaryRowProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-tint">
        <Icon size={19} className="text-brand" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
          {label}
        </p>
        <p
          className={
            muted
              ? "mt-0.5 truncate text-[15px] text-muted"
              : "mt-0.5 truncate text-[15px] font-semibold text-ink"
          }
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <Pencil size={14} />
        Edit
      </button>
    </div>
  );
}

/** Step 5 — review everything, edit any part, then submit. */
export function StepReview({
  data,
  onEdit,
  onSubmit,
  submitting,
  progress,
}: StepReviewProps) {
  const rows: SummaryRowProps[] = [
    {
      icon: Target,
      label: "Analysis",
      value: data.analysisType || "—",
      onEdit: () => onEdit(0),
    },
    {
      icon: Crosshair,
      label: "Goal",
      value: data.goal || "—",
      onEdit: () => onEdit(1),
    },
    {
      icon: Video,
      label: "Video",
      value: data.fileMeta
        ? `${data.fileMeta.name} · ${formatBytes(data.fileMeta.size)}`
        : "No file",
      onEdit: () => onEdit(2),
    },
    {
      icon: MessageSquareText,
      label: "Notes",
      value: data.notes?.trim() || "No notes added",
      onEdit: () => onEdit(3),
      muted: !data.notes?.trim(),
    },
  ];

  return (
    <div>
      <StepHeader
        title="Review your submission"
        subtitle="Check everything looks right. You can edit any part before sending."
      />

      <div className="grid gap-3">
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
          >
            <SummaryRow {...row} />
          </motion.div>
        ))}
      </div>

      {/* Live upload progress while sending to the coach. */}
      {submitting && (
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-ink">Uploading your video…</span>
            <span className="tabular-nums text-muted">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
        </div>
      )}

      <Button
        onClick={onSubmit}
        disabled={submitting}
        className={submitting ? "mt-4 w-full" : "mt-8 w-full"}
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Sending to your coach…
          </>
        ) : (
          "Submit to coach"
        )}
      </Button>
    </div>
  );
}
