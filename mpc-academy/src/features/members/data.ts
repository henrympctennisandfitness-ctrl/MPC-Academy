import { CURRENT_MEMBER } from "@/lib/member";

/**
 * Member profile — the signed-in member only.
 * ---------------------------------------------------------------------------
 * There is no academy roster and members can never browse other members: the
 * portal only ever shows YOU. Identity comes from the mock `CURRENT_MEMBER`
 * (until real auth lands). No fabricated coaching data lives here — the member's
 * live coaching feedback and history come from Google Sheets on My Progress.
 * All members are simply "Academy Member" (no tiers). The full roster of academy
 * members lives only in the Coach Studio, loaded live from Google Sheets.
 */

export interface Member {
  name: string;
  initials: string;
  image?: string; // optional avatar URL (initials shown when absent)
  membershipId: string;
  /** Every member is an "Academy Member" — no tiers. */
  role: "Academy Member";
  level: string; // playing level
  hand: "Right-handed" | "Left-handed";
  favouriteShot: string;
  joined: string;
}

/** "Henry Macdonald" → "HM". */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * The signed-in member's profile identity. Built from the mock current member
 * so the portal only ever renders the logged-in user — never anyone else.
 */
export function getCurrentMemberProfile(): Member {
  return {
    name: CURRENT_MEMBER.fullName,
    initials: initialsOf(CURRENT_MEMBER.fullName),
    membershipId: CURRENT_MEMBER.membershipId,
    role: "Academy Member",
    level: "Advanced · NTRP 4.0",
    hand: "Right-handed",
    favouriteShot: "Forehand",
    joined: "Jan 2025",
  };
}
