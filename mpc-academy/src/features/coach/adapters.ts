/**
 * Coach feature — adapters from the Google Sheets `Submission` shape to the
 * coach UI's domain types. Keeps all "sheet row → screen model" mapping in one
 * place so components stay unaware of the backend.
 */

import type { Submission } from "@/services/google";
import type { CoachMember, CoachSubmission } from "./data";

/** "Henry Walsh" → "HW"; falls back to the first character. */
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

/** Map one sheet row to the coach card model. */
export function toCoachSubmission(s: Submission): CoachSubmission {
  const { label, today } = dateLabel(s.timestamp);
  return {
    id: s.id,
    member: {
      id: s.memberEmail.toLowerCase(),
      name: s.memberName,
      initials: initialsOf(s.memberName),
      email: s.memberEmail,
      membershipId: s.membershipId,
      tier: "Standard",
      joined: monthYear(s.timestamp),
      submissionCount: 0, // filled in by deriveMembers
    },
    analysisType: s.analysisType,
    goal: s.goal,
    dateLabel: label,
    submittedAt: s.timestamp,
    status: s.status,
    notes: s.notes,
    videoUrl: "#", // Phase 2 (Drive) replaces this with the real link
    feedback: s.coachFeedback || undefined,
    today,
  };
}

/**
 * Roll submissions up into a unique member roster (keyed by email), with an
 * accurate submission count and earliest-joined date, newest activity first.
 */
export function deriveMembers(subs: CoachSubmission[]): CoachMember[] {
  const byEmail = new Map<string, CoachMember>();

  for (const s of subs) {
    const key = s.member.id;
    const existing = byEmail.get(key);
    if (!existing) {
      byEmail.set(key, { ...s.member, submissionCount: 1 });
      continue;
    }
    existing.submissionCount += 1;
    // Keep the earliest join month across the member's submissions.
    if (s.submittedAt < earliestIsoFor(existing, subs)) {
      existing.joined = s.member.joined;
    }
  }

  return Array.from(byEmail.values());
}

/** Earliest submission ISO for a member — used to pick the "joined" label. */
function earliestIsoFor(member: CoachMember, subs: CoachSubmission[]): string {
  return subs
    .filter((s) => s.member.id === member.id)
    .reduce((min, s) => (s.submittedAt < min ? s.submittedAt : min), "9999");
}
