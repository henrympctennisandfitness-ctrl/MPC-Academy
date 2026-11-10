/**
 * Coach review domain = app-side view of coach_reviews + review_annotations
 * (migration 0003). Reviews are authored only by COACH/ADMIN principals; the DB
 * enforces this via RLS. Kept minimal in Phase 1 — the review authoring flow is
 * built in Phase 3 alongside video analysis V2.
 *
 * Internal coach notes are NOT part of CoachReview (migration 0011). They live in
 * coach_review_private_notes, are staff-only at the database level, and are only
 * ever carried by CoachReviewPrivateNote, so they cannot reach a member view.
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
  completedAt: string | null;
  /** Set when a coach deliberately publishes; members see only published reviews. */
  publishedAt: string | null;
  annotations: ReviewAnnotation[];
  createdAt: string;
  updatedAt: string;
}

/** STAFF ONLY. Internal note on a review; never returned to a member. */
export interface CoachReviewPrivateNote {
  reviewId: string;
  body: string;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsRepository {
  getBySubmission(submissionId: string): Promise<CoachReview | null>;
}
