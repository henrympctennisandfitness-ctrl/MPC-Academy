"use client";

import { StepHeader } from "../StepHeader";
import { OptionButton } from "../OptionButton";
import { COACHING_GOALS } from "../../options";

interface StepGoalProps {
  value: string;
  onChange: (value: string) => void;
}

/** Step 2 — choose the coaching goal for this clip. */
export function StepGoal({ value, onChange }: StepGoalProps) {
  return (
    <div>
      <StepHeader
        title="What's the goal?"
        subtitle="This tells your coach exactly what to look for."
      />
      <div
        role="radiogroup"
        aria-label="Coaching goal"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {COACHING_GOALS.map((option) => (
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
