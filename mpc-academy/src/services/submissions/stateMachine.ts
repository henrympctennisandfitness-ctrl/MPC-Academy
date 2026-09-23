import type { SubmissionStatus } from "./types";

/**
 * Submission state machine — the app-side mirror of transition_submission()
 * (migration 0003). The DATABASE is authoritative; this exists for UI/service
 * logic and tests. Members can NEVER move a submission to IN_REVIEW/COMPLETED.
 *
 * SYSTEM = server-driven steps (post-upload/processing). In the DB these run
 * with ADMIN authority via the service role.
 */
export type Actor = "MEMBER" | "COACH" | "ADMIN" | "SYSTEM";

type TransitionMap = {
  [From in SubmissionStatus]?: { [To in SubmissionStatus]?: Actor[] };
};

const TRANSITIONS: TransitionMap = {
  DRAFT: {
    UPLOADING: ["MEMBER", "SYSTEM", "ADMIN"],
    CANCELLED: ["MEMBER", "ADMIN"],
  },
  UPLOADING: {
    PROCESSING: ["SYSTEM", "ADMIN"],
    SUBMITTED: ["SYSTEM", "ADMIN"],
    FAILED: ["SYSTEM", "ADMIN"],
    CANCELLED: ["MEMBER", "ADMIN"],
  },
  PROCESSING: {
    SUBMITTED: ["SYSTEM", "ADMIN"],
    FAILED: ["SYSTEM", "ADMIN"],
    CANCELLED: ["ADMIN"],
  },
  SUBMITTED: {
    IN_REVIEW: ["COACH", "ADMIN"],
    CANCELLED: ["ADMIN"],
  },
  IN_REVIEW: {
    COMPLETED: ["COACH", "ADMIN"],
    SUBMITTED: ["COACH", "ADMIN"],
    CANCELLED: ["ADMIN"],
  },
  COMPLETED: {},
  FAILED: {},
  CANCELLED: {},
};

/** Statuses at which a held monthly entitlement should be released. */
export const RELEASE_ENTITLEMENT_ON: readonly SubmissionStatus[] = ["FAILED", "CANCELLED"];

export function canTransition(
  from: SubmissionStatus,
  to: SubmissionStatus,
  actor: Actor,
): boolean {
  const allowed = TRANSITIONS[from]?.[to];
  return allowed !== undefined && allowed.includes(actor);
}

export function assertTransition(
  from: SubmissionStatus,
  to: SubmissionStatus,
  actor: Actor,
): void {
  if (!canTransition(from, to, actor)) {
    throw new Error(`Illegal submission transition ${from} -> ${to} by ${actor}`);
  }
}

export function isTerminal(status: SubmissionStatus): boolean {
  const outgoing = TRANSITIONS[status];
  return outgoing === undefined || Object.keys(outgoing).length === 0;
}

export function shouldReleaseEntitlement(to: SubmissionStatus): boolean {
  return RELEASE_ENTITLEMENT_ON.includes(to);
}
