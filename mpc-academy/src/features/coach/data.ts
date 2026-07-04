/**
 * Coach domain types.
 * The screen models the coach UI renders. Live data now comes from Google
 * Sheets: the store (store.tsx) loads rows via `@/services/google` and maps them
 * with `adapters.ts`. Keep these shapes in sync with `Submission` in the service.
 */

export type SubmissionStatus = "New" | "In Review" | "Completed";

export interface CoachMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  membershipId: string;
  tier: "Standard" | "Elite";
  joined: string;
  submissionCount: number;
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
  today?: boolean;
}
