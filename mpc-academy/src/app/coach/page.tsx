import type { Metadata } from "next";
import { CoachHome } from "@/features/coach";

export const metadata: Metadata = { title: "Coach · Today's Queue" };

/** Coach dashboard home. Chrome is provided by RootShell → CoachShell. */
export default function CoachPage() {
  return <CoachHome />;
}
