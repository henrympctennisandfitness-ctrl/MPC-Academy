"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";

interface WizardNavProps {
  onBack: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** Hide the Next button (e.g. Review uses its own Submit control). */
  hideNext?: boolean;
}

/** Consistent footer navigation. One clear forward action per screen. */
export function WizardNav({
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Continue",
  nextDisabled = false,
  hideNext = false,
}: WizardNavProps) {
  return (
    <div className="mt-10 flex items-center justify-between gap-3">
      <Button variant="ghost" onClick={onBack}>
        <ChevronLeft size={18} />
        {backLabel}
      </Button>

      {!hideNext && (
        <Button onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
          <ChevronRight size={18} />
        </Button>
      )}
    </div>
  );
}
