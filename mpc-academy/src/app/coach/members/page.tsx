import type { Metadata } from "next";
import { MembersView } from "@/features/coach";

export const metadata: Metadata = { title: "Coach · Members" };

/**
 * The Coach Studio is the ONLY place the full academy roster is listed, loaded
 * live from Google Sheets (derived from submissions). Members never see it.
 */
export default function CoachMembersPage() {
  return <MembersView />;
}
