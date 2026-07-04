import type { Metadata } from "next";
import { MembersIndex } from "@/features/members";

export const metadata: Metadata = { title: "Members" };

/** Members directory route. Thin wrapper over the members feature. */
export default function MembersPage() {
  return <MembersIndex />;
}
