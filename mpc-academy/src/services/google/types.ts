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
  /** Original filename of the uploaded video. */
  videoFilename: string;
  /**
   * Google Drive URL of the uploaded video (empty until/unless a file is
   * uploaded). Phase 3 stores the real Drive link here — this column was
   * previously "Video Placeholder".
   */
  videoUrl: string;
}

/**
 * The metadata a member provides when creating a submission.
 * The video itself is uploaded directly to Google Drive from the browser (see
 * drive.ts) BEFORE this is called — Apps Script only ever receives metadata,
 * never file bytes. `videoUrl`/`videoFilename` describe the already-uploaded clip.
 */
export interface NewSubmissionInput {
  /** Optional pre-generated ID (so it can match the Drive filename). */
  id?: string;
  memberName: string;
  memberEmail: string;
  membershipId: string;
  analysisType: string;
  goal: string;
  notes?: string;
  /** Drive URL of the already-uploaded video ("" when none). */
  videoUrl?: string;
  /** Original filename of the uploaded video. */
  videoFilename?: string;
}

/** Result of a direct-to-Drive video upload. */
export interface DriveUploadResult {
  /** Google Drive file ID. */
  fileId: string;
  /** Shareable Drive URL (…/file/d/<id>/view). */
  videoUrl: string;
}

/** Uniform result shape every service call resolves to. */
export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
