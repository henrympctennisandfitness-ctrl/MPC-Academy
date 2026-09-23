/**
 * Submissions barrel — client-safe.
 *
 * The Supabase repository (server-only) is deliberately excluded so it is never
 * pulled into a client bundle. Import it directly from "./supabase.repository"
 * in server code.
 */
export {
  SUBMISSION_STATUSES,
  VIDEO_PROVIDERS,
  type SubmissionStatus,
  type VideoProvider,
  type Submission,
  type VideoAsset,
  type SubmissionsRepository,
} from "./types";
export {
  type Actor,
  RELEASE_ENTITLEMENT_ON,
  canTransition,
  assertTransition,
  isTerminal,
  shouldReleaseEntitlement,
} from "./stateMachine";
export {
  type SubmissionRow,
  mapRowToSubmission,
  toInsertPayload,
} from "./mappers";
export {
  ANALYSIS_TYPES,
  GOALS,
  NOTES_MAX,
  createSubmissionSchema,
  type CreateSubmissionInput,
} from "./validation";
export { SeedSubmissionsRepository } from "./seed.repository";
