import type { Metadata } from "next";
import { MemberProfile, MY_PROFILE_SLUG } from "@/features/members";

export const metadata: Metadata = { title: "My Profile" };

/**
 * Member portal — "My profile" only. Resolves to the signed-in member and
 * never the wider roster (placeholder slug until auth is wired). No back link:
 * this is the member's own top-level "You" destination.
 */
export default function MyProfilePage() {
  return <MemberProfile slug={MY_PROFILE_SLUG} />;
}
