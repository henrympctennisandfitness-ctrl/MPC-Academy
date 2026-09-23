/**
 * Entitlement model (pure) — the app-side mirror of the DB functions
 * claim_entitlement / release_entitlement / grant_entitlement (migration 0004).
 *
 * Consumption rules (documented in docs/DATABASE.md):
 *   - A unit is CONSUMED when a submission first claims it (at upload creation).
 *   - It is RELEASED (restored) if that submission later FAILS, is CANCELLED,
 *     Cloudflare processing fails (Phase 3), or an admin voids it.
 *   - Claim and release are IDEMPOTENT per submission id, so duplicate browser
 *     requests and retries cannot double-consume or double-restore.
 *   - An abandoned upload therefore never permanently consumes the allowance.
 *
 * The DATABASE remains authoritative (atomic `used < allowance`); this model
 * lets us unit-test the semantics and drive UI without a live DB.
 */

export interface EntitlementState {
  allowance: number;
  used: number;
}

export function remaining(s: EntitlementState): number {
  return Math.max(0, s.allowance - s.used);
}

export function canConsume(s: EntitlementState): boolean {
  return s.used < s.allowance;
}

/** In-memory ledger keyed by period, with per-submission idempotency. */
export class InMemoryEntitlementLedger {
  private periods = new Map<string, EntitlementState>();
  // submissionId -> { period, released }
  private holds = new Map<string, { period: string; released: boolean }>();

  constructor(private readonly defaultAllowance: number = 1) {}

  private ensure(period: string): EntitlementState {
    let s = this.periods.get(period);
    if (!s) {
      s = { allowance: this.defaultAllowance, used: 0 };
      this.periods.set(period, s);
    }
    return s;
  }

  state(period: string): EntitlementState {
    return { ...this.ensure(period) };
  }

  /** Claim one unit for a submission. Idempotent per submission. */
  claim(submissionId: string, period: string): boolean {
    const existing = this.holds.get(submissionId);
    if (existing && !existing.released) return true; // already held by this submission

    const s = this.ensure(period);
    if (s.used >= s.allowance) return false; // exhausted
    s.used += 1;
    this.holds.set(submissionId, { period, released: false });
    return true;
  }

  /** Release a previously-held unit. Idempotent per submission. */
  release(submissionId: string): boolean {
    const hold = this.holds.get(submissionId);
    if (!hold || hold.released) return false;
    const s = this.ensure(hold.period);
    s.used = Math.max(0, s.used - 1);
    hold.released = true;
    return true;
  }

  /** Bonus/manual grant — raises the allowance for a period. */
  grant(period: string, amount: number): EntitlementState {
    const s = this.ensure(period);
    s.allowance += amount;
    return { ...s };
  }
}
