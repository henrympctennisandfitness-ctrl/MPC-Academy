/**
 * Coach domain types.
 * The screen models the coach UI renders. Live data now comes from Google
 * Sheets: the store (store.tsx) loads rows via `@/services/google` and maps them
 * with `adapters.ts`. Keep these shapes in sync with `Submission` in the service.
 */

export type SubmissionStatus = "New" | "In Review" | "Completed";

/** The canonical set, used as the safe fallback and for normalisation. */
export const DEFAULT_STATUS: SubmissionStatus = "New";

/**
 * Coerce any value coming from Google Sheets into a known SubmissionStatus.
 * Handles missing, blank, differently-cased or unexpected values by falling
 * back to "New" — so a messy row can never crash the UI.
 */
export function normalizeStatus(value: unknown): SubmissionStatus {
  if (typeof value !== "string") return DEFAULT_STATUS;
  const v = value.trim().toLowerCase();
  if (v === "in review" || v === "in-review" || v === "inreview" || v === "review") {
    return "In Review";
  }
  if (v === "completed" || v === "complete" || v === "done") return "Completed";
  if (v === "new") return "New";
  return DEFAULT_STATUS;
}

export interface CoachMember {
  /** Stable dedup key (email → membership ID → name). Also the profile slug. */
  id: string;
  name: string;
  initials: string;
  email: string;
  membershipId: string;
  joined: string;
  /** Total submissions this member has made. */
  submissionCount: number;
  /** ISO timestamp of their most recent submission (for sorting). */
  latestSubmittedAt: string;
  /** Pre-formatted label of the most recent submission date. */
  latestDateLabel: string;
  /** Status of their most recent submission. */
  latestStatus: SubmissionStatus;
}

export interface CoachSubmission {
  id: string;
  member: CoachMember;
  analysisType: string;
  goal: string;
  dateLabel: string; // pre-formatted to avoid locale/hydration drift
  submittedAt: string; // ISO, for sorting
  status: SubmissionStatus;
  notes: string;
  videoUrl: string;
  feedback?: string;
  /** Coach's notes, shown to the member on My Progress alongside feedback. */
  coachNotes?: string;
  /** 0–100 progress rating the coach assigns; null when not yet rated. */
  progressRating?: number | null;
  today?: boolean;
}
