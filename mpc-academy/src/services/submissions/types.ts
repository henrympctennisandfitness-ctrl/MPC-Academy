/** Submission domain types. Status values match the DB enum (migration 0001). */

export const SUBMISSION_STATUSES = [
  "DRAFT",
  "UPLOADING",
  "PROCESSING",
  "SUBMITTED",
  "IN_REVIEW",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const VIDEO_PROVIDERS = ["GOOGLE_DRIVE_LEGACY", "CLOUDFLARE_STREAM"] as const;
export type VideoProvider = (typeof VIDEO_PROVIDERS)[number];

export interface Submission {
  id: string;
  memberId: string; // internal app_users UUID — the ownership boundary
  status: SubmissionStatus;
  analysisType: string;
  goal: string;
  notes: string;
  assignedCoachId: string | null;
  /** First-of-month entitlement period (YYYY-MM-01, Europe/London), or null pre-claim. */
  period: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoAsset {
  id: string;
  submissionId: string;
  provider: VideoProvider;
  externalId: string | null;
  playbackRef: string | null;
  /** Legacy Google Drive public URL only. A documented security limitation. */
  legacyPublicUrl: string | null;
  status: string;
}

/** Repository seam. Seed + Supabase implementations both satisfy this. */
export interface SubmissionsRepository {
  listByMember(memberId: string): Promise<Submission[]>;
  getById(id: string): Promise<Submission | null>;
  /** Coach queue, optionally filtered by status. */
  listForCoach(status?: SubmissionStatus): Promise<Submission[]>;
}
