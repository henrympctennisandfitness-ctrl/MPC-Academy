import type { Metadata } from "next";
import { LibraryView } from "@/features/library";

export const metadata: Metadata = { title: "Coaching Library" };

/**
 * Coaching Library route. Thin wrapper — all logic lives in the `library`
 * feature module so this page stays declarative and other routes are untouched.
 */
export default function LibraryPage() {
  return <LibraryView />;
}
