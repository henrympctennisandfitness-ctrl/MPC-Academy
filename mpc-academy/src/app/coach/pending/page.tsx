import type { Metadata } from "next";
import { SubmissionList } from "@/features/coach";

export const metadata: Metadata = { title: "Coach · Pending" };

export default function CoachPendingPage() {
  return (
    <SubmissionList
      scope="pending"
      title="Pending Reviews"
      subtitle="Everything still waiting for feedback."
    />
  );
}
