import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { TrendingUp } from "lucide-react";

export const metadata: Metadata = { title: "My Progress" };

/** My Progress. Previous analyses + feedback will list here. */
export default function ProgressPage() {
  return (
    <PagePlaceholder
      icon={TrendingUp}
      title="My progress"
      description="Every clip you've submitted and where it stands will appear here."
    />
  );
}
