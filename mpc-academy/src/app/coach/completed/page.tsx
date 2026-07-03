import type { Metadata } from "next";
import { SubmissionList } from "@/features/coach";

export const metadata: Metadata = { title: "Coach · Completed" };

export default function CoachCompletedPage() {
  return (
    <SubmissionList
      scope="completed"
      title="Completed Reviews"
      subtitle="Feedback you've already sent back."
    />
  );
}
