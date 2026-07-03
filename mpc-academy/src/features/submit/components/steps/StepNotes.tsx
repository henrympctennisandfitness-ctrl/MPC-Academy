"use client";

import { StepHeader } from "../StepHeader";
import { NOTES_MAX } from "../../schema";

interface StepNotesProps {
  value: string;
  onChange: (value: string) => void;
}

/** Step 4 — optional context for the coach. */
export function StepNotes({ value, onChange }: StepNotesProps) {
  return (
    <div>
      <StepHeader
        title="Anything to add?"
        subtitle="Optional — but the more context you give, the sharper the feedback."
      />

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, NOTES_MAX))}
          rows={7}
          placeholder="What would you like your coach to focus on?"
          className="w-full resize-none rounded-2xl border border-line bg-surface p-4 text-[15.5px] leading-relaxed shadow-card outline-none transition-shadow placeholder:text-[#9aa1ab] focus:border-brand focus:shadow-[0_0_0_4px_rgba(14,77,58,0.10)]"
        />
        <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-muted">
          {value.length}/{NOTES_MAX}
        </span>
      </div>
    </div>
  );
}
