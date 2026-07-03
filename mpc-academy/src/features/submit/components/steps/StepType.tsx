"use client";

import { StepHeader } from "../StepHeader";
import { OptionButton } from "../OptionButton";
import { ANALYSIS_TYPES } from "../../options";

interface StepTypeProps {
  value: string;
  onChange: (value: string) => void;
}

/** Step 1 — pick the shot or area to analyse. */
export function StepType({ value, onChange }: StepTypeProps) {
  return (
    <div>
      <StepHeader
        title="What are we analysing?"
        subtitle="Pick the shot or area you'd like your coach to focus on."
      />
      <div
        role="radiogroup"
        aria-label="Analysis type"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {ANALYSIS_TYPES.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            icon={option.icon}
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}
