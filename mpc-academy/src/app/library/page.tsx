import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Coaching Library" };

/** Coaching Library. Categorised articles + videos grid. */
export default function LibraryPage() {
  return (
    <PagePlaceholder
      icon={BookOpen}
      title="Coaching library"
      description="Drills, breakdowns and guides from the academy team will live here."
    />
  );
}
