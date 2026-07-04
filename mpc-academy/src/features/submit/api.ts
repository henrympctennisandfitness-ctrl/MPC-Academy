import { createSubmission } from "@/services/google";

/**
 * Submit — feature-level adapter over the Google Sheets service.
 *
 * Phase 1 is Google Sheets ONLY: we record the submission (member details,
 * wizard answers and the chosen video's *filename*) as a new row. The video
 * bytes are NOT uploaded yet — Google Drive is Phase 2 and slots in behind
 * `createSubmission` without this module or the wizard changing.
 *
 * `uploadSubmission` keeps the same shape the wizard already calls, including a
 * smooth progress signal, so the UI is untouched. The progress here is a short
 * animation (there's no large upload to measure in Phase 1) purely to keep the
 * premium submit experience intact.
 */

export interface SubmissionPayload {
  name: string;
  email: string;
  membershipId: string;
  analysisType: string;
  goal: string;
  notes?: string;
  /** The chosen clip — only its filename is recorded in Phase 1. */
  file: File;
}

export interface SubmissionResult {
  ok: boolean;
  id?: string;
  message?: string;
  error?: string;
}

export interface UploadOptions {
  /** Called with 0–100 as the submission is recorded. */
  onProgress?: (percent: number) => void;
  /** Abort the in-flight submission. */
  signal?: AbortSignal;
}

/**
 * Record a submission in Google Sheets. Resolves on success; rejects with a
 * human-readable Error the wizard surfaces as a toast.
 */
export async function uploadSubmission(
  payload: SubmissionPayload,
  opts: UploadOptions = {},
): Promise<SubmissionResult> {
  opts.onProgress?.(5);

  // Brief, smooth progress while the row is written (no large upload in Phase 1).
  const ticker = startProgress(opts.onProgress, opts.signal);

  try {
    const result = await createSubmission({
      memberName: payload.name,
      memberEmail: payload.email,
      membershipId: payload.membershipId,
      analysisType: payload.analysisType,
      goal: payload.goal,
      notes: payload.notes,
      videoFilename: payload.file?.name,
    });

    ticker.stop();
    if (opts.signal?.aborted) {
      throw new DOMException("Submission cancelled", "AbortError");
    }
    if (!result.ok) {
      throw new Error(result.error || "The submission was rejected.");
    }

    opts.onProgress?.(100);
    return {
      ok: true,
      id: result.data?.id,
      message: "Submission received — your coach has it.",
    };
  } catch (err) {
    ticker.stop();
    throw err instanceof Error ? err : new Error("Submission failed. Try again.");
  }
}

/** Animate progress toward ~90% until the write resolves. */
function startProgress(
  onProgress: UploadOptions["onProgress"],
  signal?: AbortSignal,
): { stop: () => void } {
  if (!onProgress) return { stop: () => {} };
  let p = 5;
  const timer = setInterval(() => {
    if (signal?.aborted) return;
    p = Math.min(90, p + 9 + Math.random() * 8);
    onProgress(Math.round(p));
  }, 90);
  return { stop: () => clearInterval(timer) };
}
