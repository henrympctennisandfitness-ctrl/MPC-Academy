/**
 * Coach feature — adapters from the Google Sheets `Submission` shape to the
 * coach UI's domain types. Keeps all "sheet row → screen model" mapping in one
 * place so components stay unaware of the backend.
 */

import type { Submission } from "@/services/google";
import { normalizeStatus } from "./data";
import type { CoachMember, CoachSubmission } from "./data";

/** "Henry Macdonald" → "HM"; falls back to the first character. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic date label (no locale drift), e.g. "Today, 9:24am" / "3 Jul". */
function dateLabel(iso: string): { label: string; today: boolean } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { label: "—", today: false };

  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return { label: `Today, ${h}:${m}${ampm}`, today: true };
  }

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return { label: `${d.getDate()} ${MONTHS[d.getMonth()]}`, today: false };
}

/** "Jan 2025" from an ISO timestamp. */
function monthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Stable identity for a member, so multiple submissions collapse to one card.
 * Deduplicate by email first; if the email is missing, fall back to Membership
 * ID; if both are missing, fall back to the exact (case-insensitive) name.
 * Prefixes keep the three key spaces from ever colliding.
 */
export function memberKey(m: {
  email?: string;
  membershipId?: string;
  name?: string;
}): string {
  const email = (m.email ?? "").trim().toLowerCase();
  if (email) return `e:${email}`;
  const membershipId = (m.membershipId ?? "").trim().toLowerCase();
  if (membershipId) return `m:${membershipId}`;
  const name = (m.name ?? "").trim().toLowerCase();
  if (name) return `n:${name}`;
  return "unknown";
}

/** Map one sheet row to the coach card model. */
export function toCoachSubmission(s: Submission): CoachSubmission {
  const { label, today } = dateLabel(s.timestamp);
  const status = normalizeStatus(s.status);
  return {
    id: s.id,
    member: {
      id: memberKey({
        email: s.memberEmail,
        membershipId: s.membershipId,
        name: s.memberName,
      }),
      name: s.memberName,
      initials: initialsOf(s.memberName),
      email: s.memberEmail,
      membershipId: s.membershipId,
      joined: monthYear(s.timestamp),
      // Per-submission placeholders; deriveMembers rolls these up per member.
      submissionCount: 0,
      latestSubmittedAt: s.timestamp,
      latestDateLabel: label,
      latestStatus: status,
    },
    analysisType: s.analysisType,
    goal: s.goal,
    dateLabel: label,
    submittedAt: s.timestamp,
    status,
    notes: s.notes,
    videoUrl: s.videoUrl || "",
    videoFilename: s.videoFilename || "",
    feedback: s.coachFeedback || undefined,
    coachNotes: s.coachNotes || undefined,
    progressRating: typeof s.progressRating === "number" ? s.progressRating : null,
    today,
  };
}

/**
 * Roll submissions up into a unique member roster — exactly ONE entry per
 * member (deduplicated via `memberKey`). Each card aggregates the member's
 * total submission count, latest submission date and latest status. Sorted by
 * most recent activity first.
 */
export function deriveMembers(subs: CoachSubmission[]): CoachMember[] {
  const byKey = new Map<string, CoachMember>();

  for (const s of subs) {
    const key = s.member.id;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, { ...s.member, submissionCount: 1 });
      continue;
    }

    existing.submissionCount += 1;
    // Latest submission wins for the displayed identity + status/date.
    if (s.submittedAt > existing.latestSubmittedAt) {
      existing.name = s.member.name;
      existing.initials = s.member.initials;
      existing.email = s.member.email;
      existing.membershipId = s.member.membershipId;
      existing.latestSubmittedAt = s.submittedAt;
      existing.latestDateLabel = s.member.latestDateLabel;
      existing.latestStatus = s.member.latestStatus;
    }
  }

  return Array.from(byKey.values()).sort((a, b) =>
    b.latestSubmittedAt.localeCompare(a.latestSubmittedAt),
  );
}
