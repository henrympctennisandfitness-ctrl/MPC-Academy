import type { Member } from "@/types";

/**
 * Current member.
 * Placeholder until authentication lands (see FEATURES.auth). Replace with the
 * real session — the wizard only reads name / email / membershipId from here.
 */
export const CURRENT_MEMBER: Member = {
  id: "mem_demo",
  firstName: "Henry",
  fullName: "Henry Walsh",
  email: "henry.walsh@example.com",
  membershipId: "MPC-2041",
  tier: "Elite",
};
