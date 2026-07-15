import {
  createSubmission,
  uploadVideoToDrive,
  generateSubmissionId,
  isDriveConfigured,
} from "@/services/google";
import { GOOGLE_CONFIG } from "@/lib/config";

/**
 * Submit — feature-level orchestrator.
 *
 * Two-step flow (video bytes never touch Apps Script):
 *   1. Upload the selected file DIRECTLY to Google Drive (resumable, up to 3GB,
 *      with real progress and interrupted-upload recovery). → Drive URL.
 *   2. Send only metadata (member, submission, Drive URL, filename, analysis,
 *      goal, notes) to Apps Script, which appends the Sheet row.
 *
 * If the Drive upload fails we surface the error and never write a video-less
 * submission. When Drive isn't configured (dev), the upload step is skipped and
 * the submission is recorded with an empty video URL.
 */

export interface SubmissionPayload {
  name: string;
  email: string;
  membershipId: string;
  analysisType: string;
  goal: string;
  notes?: string;
  /** The chosen clip — uploaded directly to Drive. */
  file: File;
}

export interface SubmissionResult {
  ok: boolean;
  id?: string;
  videoUrl?: string;
  message?: string;
  error?: string;
}

export interface UploadOptions {
  /** Called with 0–100 as the video uploads to Drive. */
  onProgress?: (percent: number) => void;
  /** Abort the in-flight upload. */
  signal?: AbortSignal;
}

function formatGB(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

/** Validate the file. Returns an error message, or null when acceptable. */
function validateFile(file: File | undefined): string | null {
  if (!file) return "Attach a video before submitting.";

  const accepted = GOOGLE_CONFIG.acceptedVideo as readonly string[];
  // Some browsers report an empty type for .mov etc. — don't hard-block those.
  if (file.type && !accepted.includes(file.type)) {
    return "That format isn't supported. Use MP4, MOV or MPEG.";
  }
  if (file.size > GOOGLE_CONFIG.maxUploadBytes) {
    return `This video is over the ${formatGB(GOOGLE_CONFIG.maxUploadBytes)} limit. Trim it and try again.`;
  }
  return null;
}

/** Strip characters that don't belong in a Drive filename. */
function driveFilename(id: string, analysisType: string, original: string): string {
  return `${id} - ${analysisType} - ${original}`.replace(/[\/\\]+/g, "-").trim();
}

/**
 * Upload the video to Drive, then record the submission. Resolves on success;
 * rejects with a human-readable Error the wizard surfaces as a premium toast.
 */
export async function uploadSubmission(
  payload: SubmissionPayload,
  opts: UploadOptions = {},
): Promise<SubmissionResult> {
  const invalid = validateFile(payload.file);
  if (invalid) throw new Error(invalid);

  const id = generateSubmissionId();
  let videoUrl = "";

  // 1. Direct-to-Drive upload (skipped when Drive isn't configured — dev).
  if (isDriveConfigured()) {
    const uploaded = await uploadVideoToDrive(payload.file, {
      name: driveFilename(id, payload.analysisType, payload.file.name),
      onProgress: opts.onProgress,
      signal: opts.signal,
    });
    videoUrl = uploaded.videoUrl;
  } else {
    opts.onProgress?.(100);
  }

  if (opts.signal?.aborted) {
    throw new DOMException("Submission cancelled", "AbortError");
  }

  // 2. Record metadata (Apps Script / mock) — no bytes.
  const result = await createSubmission({
    id,
    memberName: payload.name,
    memberEmail: payload.email,
    membershipId: payload.membershipId,
    analysisType: payload.analysisType,
    goal: payload.goal,
    notes: payload.notes,
    videoUrl,
    videoFilename: payload.file.name,
  });

  if (!result.ok) {
    throw new Error(result.error || "Couldn't save your submission.");
  }

  return {
    ok: true,
    id: result.data?.id,
    videoUrl: result.data?.videoUrl,
    message: isDriveConfigured()
      ? "Video uploaded — your coach has it."
      : "Submission received — your coach has it.",
  };
}
