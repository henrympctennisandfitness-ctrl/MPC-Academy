import type { Metadata } from "next";
import { MembersView } from "@/features/coach";

export const metadata: Metadata = { title: "Coach · Members" };

export default function CoachMembersPage() {
  return <MembersView />;
}
