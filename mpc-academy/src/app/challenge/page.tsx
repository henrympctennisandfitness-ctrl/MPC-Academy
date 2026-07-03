import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { Trophy } from "lucide-react";

export const metadata: Metadata = { title: "Monthly Challenge" };

/** Monthly Challenge. Leaderboard, points, badges, progress. */
export default function ChallengePage() {
  return (
    <PagePlaceholder
      icon={Trophy}
      title="Monthly challenge"
      description="Leaderboard, points, badges and your progress will live here."
    />
  );
}
