"use client";

import { Check, MessageSquare, Eye, Film, VideoOff } from "lucide-react";
import { Button } from "@/components/ui";
import { VideoThumb } from "./VideoThumb";
import { StatusPill } from "./StatusPill";
import type { CoachSubmission } from "../data";

interface SubmissionCardProps {
  submission: CoachSubmission;
  onReview: () => void;
  onMarkComplete: () => void;
  onReturnFeedback: () => void;
}

/** One submission, with everything a coach needs to triage at a glance. */
export function SubmissionCard({
  submission,
  onReview,
  onMarkComplete,
  onReturnFeedback,
}: SubmissionCardProps) {
  const { member, analysisType, goal, dateLabel, status, notes } = submission;
  const completed = status === "Completed";
  const hasVideo = Boolean(submission.videoUrl || submission.videoFilename);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover sm:p-5">
      {/* Member + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-[13px] font-semibold text-brand">
            {member.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight">
              {member.name}
            </p>
            <p className="truncate text-[12.5px] text-muted">
              {member.membershipId}
            </p>
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      {/* Video + details */}
      <div className="mt-4 flex gap-4">
        <VideoThumb size="card" onClick={onReview} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{analysisType}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
            <span className="rounded-md bg-background px-2 py-0.5 font-medium text-ink">
              {goal}
            </span>
            <span aria-hidden>·</span>
            <span>{dateLabel}</span>
            <span aria-hidden>·</span>
            {hasVideo ? (
              <span className="inline-flex items-center gap-1 font-medium text-brand">
                <Film size={13} />
                Video
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <VideoOff size={13} />
                No video
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
            {completed && submission.feedback ? submission.feedback : notes}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
        <Button variant="ghost" size="sm" onClick={onReview}>
          <Eye size={16} />
          Review
        </Button>
        {!completed && (
          <Button variant="ghost" size="sm" onClick={onMarkComplete}>
            <Check size={16} />
            Mark Complete
          </Button>
        )}
        <Button
          variant={completed ? "ghost" : "primary"}
          size="sm"
          onClick={onReturnFeedback}
          className="ml-auto"
        >
          <MessageSquare size={16} />
          {completed ? "Update feedback" : "Return Feedback"}
        </Button>
      </div>
    </div>
  );
}
