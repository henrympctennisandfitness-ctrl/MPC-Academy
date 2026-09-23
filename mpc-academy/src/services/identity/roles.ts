/**
 * Identity & role helpers (pure, framework-agnostic).
 *
 * These mirror the database roles (see supabase migrations 0002/0006). They are
 * the app-side view of authorization; the DATABASE remains the authority via RLS.
 * UI must never treat these as security on their own.
 */

export const APP_ROLES = ["MEMBER", "COACH", "ADMIN"] as const;
export type AppRole = (typeof APP_ROLES)[number];

/** A resolved principal. `userId` is the internal app_users UUID (Phase 2 fills it). */
export interface Principal {
  userId: string;
  roles: AppRole[];
}

export function hasRole(p: Principal, role: AppRole): boolean {
  return p.roles.includes(role);
}

/** Coach Studio access = COACH or ADMIN. */
export function isCoach(p: Principal): boolean {
  return hasRole(p, "COACH") || hasRole(p, "ADMIN");
}

export function isAdmin(p: Principal): boolean {
  return hasRole(p, "ADMIN");
}

export function canReviewSubmissions(p: Principal): boolean {
  return isCoach(p);
}

export function canManageContent(p: Principal): boolean {
  return isAdmin(p);
}

/** Ownership boundary — the internal UUID is the only thing that grants ownership. */
export function ownsSubmission(p: Principal, submission: { memberId: string }): boolean {
  return submission.memberId === p.userId;
}

/** A member may view their own submission; coaches/admins may view any. No enumeration for members. */
export function canViewSubmission(p: Principal, submission: { memberId: string }): boolean {
  return ownsSubmission(p, submission) || isCoach(p);
}
