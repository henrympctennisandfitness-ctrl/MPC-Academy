/**
 * Google Sheets backend — public surface.
 * Import everything Google-related from here (`@/services/google`) so features
 * never reach into individual modules.
 */

export { GOOGLE_SHEETS_CONFIG, isSheetsConfigured } from "./config";
export {
  createSubmission,
  fetchSubmissions,
  fetchSubmissionsByEmail,
  updateStatus,
  updateFeedback,
  updateProgressRating,
  generateSubmissionId,
  VIDEO_PLACEHOLDER,
} from "./submissions";
export type {
  Submission,
  SubmissionStatus,
  NewSubmissionInput,
  ServiceResult,
} from "./types";
