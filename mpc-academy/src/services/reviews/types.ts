/**
 * Coach review domain = app-side view of coach_reviews + review_annotations
 * (migration 0003). Reviews are authored only by COACH/ADMIN principals; the DB
 * enforces this via RLS. Kept minimal in Phase 1 — the review authoring flow is
 * built in Phase 3 alongside video analysis V2.
 */

export interface ReviewAnnotation {
  id: string;
  reviewId: string;
  /** Optional video timestamp in milliseconds. */
  tMs: number | null;
  body: string;
  createdAt: string;
}

export interface CoachReview {
  id: string;
  submissionId: string;
  coachId: string;
  feedback: string | null;
  coachNotes: string | null;
  completedAt: string | null;
  annotations: ReviewAnnotation[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsRepository {
  getBySubmission(submissionId: string): Promise<CoachReview | null>;
}
