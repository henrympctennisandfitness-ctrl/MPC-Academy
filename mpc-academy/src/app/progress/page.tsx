import type { Metadata } from "next";
import { ProgressView } from "@/features/progress";

export const metadata: Metadata = { title: "My Progress" };

/**
 * My Progress route. Thin wrapper — all logic lives in the `progress` feature
 * module so this page stays declarative and other routes are untouched.
 */
export default function ProgressPage() {
  return <ProgressView />;
}
