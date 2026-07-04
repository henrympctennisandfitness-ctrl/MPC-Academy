import type { Metadata } from "next";
import { MemberProfile } from "@/features/members";

export const metadata: Metadata = { title: "My Profile" };

/**
 * Member portal — "My profile". Always resolves to the signed-in member and
 * never the wider roster: members can only ever see themselves. No back link:
 * this is the member's own top-level "You" destination.
 */
export default function MyProfilePage() {
  return <MemberProfile />;
}
