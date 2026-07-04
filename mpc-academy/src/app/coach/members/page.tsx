import type { Metadata } from "next";
import { MembersIndex } from "@/features/members";

export const metadata: Metadata = { title: "Coach · Members" };

/** Coaches see the full roster and can open any member profile. */
export default function CoachMembersPage() {
  return <MembersIndex basePath="/coach/members" />;
}
