import type { Metadata } from "next";
import { CoachMemberHistory } from "@/features/coach";

export const metadata: Metadata = { title: "Coach · Member history" };

/**
 * Coach-facing member profile/history. The `slug` is the member's stable dedup
 * key (URL-encoded); `CoachMemberHistory` resolves it against live submissions.
 * Chrome (and CoachProvider) come from RootShell → CoachShell.
 */
export default async function CoachMemberHistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CoachMemberHistory memberKey={decodeURIComponent(slug)} />;
}
