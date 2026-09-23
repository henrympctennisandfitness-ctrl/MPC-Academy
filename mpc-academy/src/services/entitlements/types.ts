/**
 * Entitlement repository seam.
 *
 * The interface is what the app depends on. Two implementations satisfy it:
 *   - a Supabase impl that delegates to the atomic SQL functions (migration 0004)
 *   - (tests/UI) the pure InMemoryEntitlementLedger in ./model
 *
 * The DATABASE is always the authority for real consumption: the SQL functions
 * enforce `used < allowance` atomically so concurrent requests cannot overspend
 * (decision E). This interface deliberately mirrors those functions.
 */

export const PLAN_CODES = ["TRIAL_1_MONTH", "PLAN_2_MONTH", "UNLIMITED"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export interface MonthlyEntitlement {
  memberId: string;
  /** First-of-month key (YYYY-MM-01, Europe/London). */
  period: string;
  planCode: PlanCode;
  allowance: number;
  used: number;
}

export interface EntitlementsRepository {
  /** Create the period row if missing; returns current state. */
  ensure(memberId: string, period: string, plan?: PlanCode): Promise<MonthlyEntitlement>;
  /**
   * Atomically consume one unit for a submission. Idempotent per submission.
   * Returns true if the submission holds a unit afterwards, false if exhausted.
   */
  claim(memberId: string, period: string, submissionId: string): Promise<boolean>;
  /** Restore a previously-claimed unit. Idempotent. Returns true if it released one. */
  release(submissionId: string): Promise<boolean>;
  /** Manually add/subtract allowance (bonus analysis). Audited server-side. */
  grant(
    memberId: string,
    period: string,
    amount: number,
    reason: string,
    grantedBy: string,
  ): Promise<MonthlyEntitlement>;
}
