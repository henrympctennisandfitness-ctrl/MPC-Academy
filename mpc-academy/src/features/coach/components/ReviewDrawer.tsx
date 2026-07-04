"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { X, Check, Send, Mail } from "lucide-react";
import { Button } from "@/components/ui";
import { VideoThumb } from "./VideoThumb";
import { StatusPill } from "./StatusPill";
import { useCoach } from "../store";
import type { CoachSubmission } from "../data";

interface ReviewDrawerProps {
  submission: CoachSubmission | null;
  /** Open with the feedback field focused (from "Return Feedback"). */
  focusFeedback: boolean;
  onClose: () => void;
}

/** Default rating shown on the slider before the coach has rated a submission. */
const DEFAULT_RATING = 75;

/** Slide-over for reviewing a submission and returning written feedback. */
export function ReviewDrawer({ submission, focusFeedback, onClose }: ReviewDrawerProps) {
  const { setStatus, returnFeedback, setProgressRating } = useCoach();
  const [feedback, setFeedback] = useState("");
  const [coachNotes, setCoachNotes] = useState("");
  const [rating, setRating] = useState(DEFAULT_RATING);
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync the fields whenever a different submission opens.
  useEffect(() => {
    if (submission) {
      setFeedback(submission.feedback ?? "");
      setCoachNotes(submission.coachNotes ?? "");
      setRating(submission.progressRating ?? DEFAULT_RATING);
    }
  }, [submission]);

  // Focus the feedback field when opened via "Return Feedback".
  useEffect(() => {
    if (submission && focusFeedback) {
      const t = setTimeout(() => textareaRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [submission, focusFeedback]);

  // Close on Escape.
  useEffect(() => {
    if (!submission) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submission, onClose]);

  const completed = submission?.status === "Completed";

  const handleSend = async () => {
    if (!submission || busy) return;
    if (!feedback.trim()) {
      toast.error("Write some feedback before sending.");
      textareaRef.current?.focus();
      return;
    }
    setBusy(true);
    // Persist feedback + coach notes, then the progress rating (both to Sheets).
    const sent = await returnFeedback(
      submission.id,
      feedback.trim(),
      coachNotes.trim(),
    );
    const rated = sent ? await setProgressRating(submission.id, rating) : false;
    setBusy(false);
    if (!sent || !rated) {
      toast.error("Couldn't save your review. Please try again.");
      return;
    }
    toast.success(`Feedback sent to ${submission.member.name.split(" ")[0]}`);
    onClose();
  };

  const handleComplete = async () => {
    if (!submission || busy) return;
    setBusy(true);
    const ok = await setStatus(submission.id, "Completed");
    setBusy(false);
    if (!ok) {
      toast.error("Couldn't update the submission. Please try again.");
      return;
    }
    toast.success("Marked complete");
    onClose();
  };

  return (
    <AnimatePresence>
      {submission && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-surface shadow-2xl sm:max-w-md"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            role="dialog"
            aria-label="Review submission"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-[15px] font-semibold">Review submission</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {/* Member */}
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-tint text-sm font-semibold text-brand">
                  {submission.member.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">
                    {submission.member.name}
                  </p>
                  <p className="truncate text-[13px] text-muted">
                    {submission.member.email}
                  </p>
                </div>
                <StatusPill status={submission.status} />
              </div>

              <VideoThumb size="full" />

              {/* Details */}
              <dl className="grid grid-cols-3 gap-3">
                {[
                  { k: "Analysis", v: submission.analysisType },
                  { k: "Goal", v: submission.goal },
                  { k: "Submitted", v: submission.dateLabel },
                ].map((d) => (
                  <div key={d.k} className="rounded-xl bg-background px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
                      {d.k}
                    </dt>
                    <dd className="mt-0.5 truncate text-[13.5px] font-medium">
                      {d.v}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Member's note */}
              <div>
                <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-muted">
                  Member&apos;s note
                </p>
                <p className="rounded-xl border border-line bg-background px-3.5 py-3 text-[14px] leading-relaxed text-ink">
                  {submission.notes || "No note added."}
                </p>
              </div>

              {/* Feedback */}
              <div>
                <label
                  htmlFor="coach-feedback"
                  className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.05em] text-muted"
                >
                  Your feedback
                </label>
                <textarea
                  id="coach-feedback"
                  ref={textareaRef}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={5}
                  placeholder="Write the notes you'll send back to the member…"
                  className="w-full resize-none rounded-xl border border-line bg-surface p-3.5 text-[14.5px] leading-relaxed outline-none transition-shadow placeholder:text-[#9aa1ab] focus:border-brand focus:shadow-[0_0_0_4px_rgba(14,77,58,0.10)]"
                />
              </div>

              {/* Coach notes */}
              <div>
                <label
                  htmlFor="coach-notes"
                  className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.05em] text-muted"
                >
                  Coach notes
                </label>
                <textarea
                  id="coach-notes"
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  rows={3}
                  placeholder="Extra context, drills or focus points for next time…"
                  className="w-full resize-none rounded-xl border border-line bg-surface p-3.5 text-[14.5px] leading-relaxed outline-none transition-shadow placeholder:text-[#9aa1ab] focus:border-brand focus:shadow-[0_0_0_4px_rgba(14,77,58,0.10)]"
                />
              </div>

              {/* Progress rating */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="progress-rating"
                    className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted"
                  >
                    Progress rating
                  </label>
                  <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-[13px] font-bold tabular-nums text-brand">
                    {rating}
                  </span>
                </div>
                <input
                  id="progress-rating"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: "#0E4D3A" }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t border-line px-5 py-4">
              {!completed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleComplete}
                  disabled={busy}
                >
                  <Check size={16} />
                  Mark complete
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSend}
                disabled={busy}
                className="ml-auto"
              >
                {completed ? <Mail size={16} /> : <Send size={16} />}
                {completed ? "Resend feedback" : "Send & complete"}
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
