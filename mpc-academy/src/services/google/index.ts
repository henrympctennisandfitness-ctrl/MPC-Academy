/**
 * Google Sheets backend — public surface.
 * Import everything Google-related from here (`@/services/google`) so features
 * never reach into individual modules.
 */

export {
  GOOGLE_SHEETS_CONFIG,
  GOOGLE_DRIVE_CONFIG,
  isSheetsConfigured,
  isDriveConfigured,
} from "./config";
export {
  createSubmission,
  fetchSubmissions,
  fetchSubmissionsByEmail,
  updateStatus,
  updateFeedback,
  updateProgressRating,
  generateSubmissionId,
} from "./submissions";
export { uploadVideoToDrive } from "./drive";
export type { DriveUploadOptions } from "./drive";
export type {
  Submission,
  SubmissionStatus,
  NewSubmissionInput,
  DriveUploadResult,
  ServiceResult,
} from "./types";
