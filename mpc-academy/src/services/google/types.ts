/**
 * Google Sheets backend — shared types.
 * ---------------------------------------------------------------------------
 * `Submission` mirrors one row of the Google Sheet. The column order in the
 * sheet is documented in apps-script/Code.gs (HEADERS) and must stay in sync.
 * Field names here are the camelCase keys the Apps Script sends/receives.
 */

export type SubmissionStatus = "New" | "In Review" | "Completed";

/** One submission row, exactly as stored in / returned from the Sheet. */
export interface Submission {
  /** Unique, generated at submit time (e.g. "MPC-LXY2A1-B2C3"). */
  id: string;
  /** ISO timestamp the submission was created. */
  timestamp: string;
  memberName: string;
  memberEmail: string;
  membershipId: string;
  analysisType: string;
  goal: string;
  notes: string;
  status: SubmissionStatus;
  /** Coach the submission is assigned to (may be empty until triaged). */
  assignedCoach: string;
  /** Written feedback returned to the member. */
  coachFeedback: string;
  /** Private coach-only notes (not shown to the member). */
  coachNotes: string;
  /** ISO date set when the status becomes "Completed". */
  completionDate: string;
  /** 0–100 rating the coach assigns on completion (empty string if unset). */
  progressRating: number | "";
  /** Original video filename (Drive upload lands in Phase 2). */
  videoFilename: string;
  /** Stand-in for the eventual Drive URL — see FUTURE hook in Code.gs. */
  videoPlaceholder: string;
}

/** The fields a member provides when creating a submission. */
export interface NewSubmissionInput {
  memberName: string;
  memberEmail: string;
  membershipId: string;
  analysisType: string;
  goal: string;
  notes?: string;
  /** The chosen clip's filename — the bytes are NOT uploaded in Phase 1. */
  videoFilename?: string;
}

/** Uniform result shape every service call resolves to. */
export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
