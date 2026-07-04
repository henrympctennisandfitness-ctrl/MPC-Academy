/**
 * Google Sheets backend — submissions API (the part features actually call).
 * ---------------------------------------------------------------------------
 * One reusable function per operation, each returning a `ServiceResult<T>` so
 * callers never have to try/catch — they check `result.ok` and show
 * `result.error` in a toast. When no Apps Script URL is configured every call
 * transparently routes to the in-memory mock (mock.ts) instead.
 *
 * Phase 1 is Sheets ONLY: `createSubmission` records the chosen video's
 * filename and a placeholder — it does NOT upload the bytes. Drive slots in
 * later behind this same function (see the FUTURE hook below) without the UI or
 * callers changing.
 */

import { isSheetsConfigured } from "./config";
import { getRequest, postRequest } from "./client";
import { mockDb } from "./mock";
import type {
  NewSubmissionInput,
  ServiceResult,
  Submission,
  SubmissionStatus,
} from "./types";

/** Value written to `videoPlaceholder` until real Drive upload lands. */
export const VIDEO_PLACEHOLDER = "PENDING_DRIVE_UPLOAD";

/** Generate a unique, sortable-ish submission ID, e.g. "MPC-LXY2A1-9F3B". */
export function generateSubmissionId(): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MPC-${time}-${rand}`;
}

/** Run an async operation and normalise it into a ServiceResult. */
async function run<T>(op: () => Promise<T>): Promise<ServiceResult<T>> {
  try {
    return { ok: true, data: await op() };
  } catch (err) {
    const error =
      err instanceof Error ? err.message : "Something went wrong. Try again.";
    return { ok: false, error };
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Record a new submission. Fills every field except the coach-only ones,
 * defaults Status to "New", and stores the video filename + placeholder.
 */
export async function createSubmission(
  input: NewSubmissionInput,
): Promise<ServiceResult<Submission>> {
  // Guard required fields up front so we fail with a clear message, not a 500.
  const required: Array<[keyof NewSubmissionInput, string]> = [
    ["memberName", "your name"],
    ["memberEmail", "your email"],
    ["membershipId", "your membership ID"],
    ["analysisType", "an analysis type"],
    ["goal", "a goal"],
  ];
  for (const [key, label] of required) {
    if (!String(input[key] ?? "").trim()) {
      return { ok: false, error: `Missing ${label}.` };
    }
  }

  const row: Submission = {
    id: generateSubmissionId(),
    timestamp: new Date().toISOString(),
    memberName: input.memberName.trim(),
    memberEmail: input.memberEmail.trim(),
    membershipId: input.membershipId.trim(),
    analysisType: input.analysisType,
    goal: input.goal,
    notes: input.notes?.trim() ?? "",
    status: "New",
    assignedCoach: "",
    coachFeedback: "",
    coachNotes: "",
    completionDate: "",
    progressRating: "",
    videoFilename: input.videoFilename?.trim() ?? "",
    // FUTURE (Google Drive): replace with the uploaded file's Drive URL.
    videoPlaceholder: VIDEO_PLACEHOLDER,
  };

  if (!isSheetsConfigured()) return run(async () => mockDb.create(row));
  return run(() => postRequest<Submission>({ action: "create", submission: row }));
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Every submission, newest first. Powers the coach dashboard. */
export async function fetchSubmissions(): Promise<ServiceResult<Submission[]>> {
  if (!isSheetsConfigured()) return run(async () => sortNewest(mockDb.list()));
  return run(async () =>
    sortNewest(await getRequest<Submission[]>({ action: "list" })),
  );
}

/** One member's submissions (by email), newest first. Powers My Progress. */
export async function fetchSubmissionsByEmail(
  email: string,
): Promise<ServiceResult<Submission[]>> {
  const match = email.trim().toLowerCase();
  if (!isSheetsConfigured()) {
    return run(async () =>
      sortNewest(
        mockDb.list().filter((s) => s.memberEmail.toLowerCase() === match),
      ),
    );
  }
  return run(async () =>
    sortNewest(await getRequest<Submission[]>({ action: "list", email })),
  );
}

// ---------------------------------------------------------------------------
// Update (coach actions — each writes to the Sheet immediately)
// ---------------------------------------------------------------------------

/** Change a submission's status. Sets Completion Date when moving to Completed. */
export async function updateStatus(
  id: string,
  status: SubmissionStatus,
): Promise<ServiceResult<Submission>> {
  if (!isSheetsConfigured()) {
    return run(async () =>
      mockDb.update(id, {
        status,
        completionDate:
          status === "Completed" ? new Date().toISOString() : "",
      }),
    );
  }
  return run(() =>
    postRequest<Submission>({ action: "updateStatus", id, status }),
  );
}

/** Return written feedback to the member and mark the submission Completed. */
export async function updateFeedback(
  id: string,
  feedback: string,
  coachNotes?: string,
): Promise<ServiceResult<Submission>> {
  if (!isSheetsConfigured()) {
    return run(async () =>
      mockDb.update(id, {
        coachFeedback: feedback,
        ...(coachNotes !== undefined ? { coachNotes } : {}),
        status: "Completed",
        completionDate: new Date().toISOString(),
      }),
    );
  }
  return run(() =>
    postRequest<Submission>({
      action: "updateFeedback",
      id,
      feedback,
      ...(coachNotes !== undefined ? { coachNotes } : {}),
    }),
  );
}

/** Set the 0–100 progress rating the coach assigns on completion. */
export async function updateProgressRating(
  id: string,
  rating: number,
): Promise<ServiceResult<Submission>> {
  if (!isSheetsConfigured()) {
    return run(async () => mockDb.update(id, { progressRating: rating }));
  }
  return run(() =>
    postRequest<Submission>({ action: "updateProgressRating", id, rating }),
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sortNewest(rows: Submission[]): Submission[] {
  return [...rows].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
