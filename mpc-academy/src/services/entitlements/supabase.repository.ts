import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntitlementsRepository, MonthlyEntitlement, PlanCode } from "./types";

/**
 * Supabase implementation. SERVER-ONLY.
 *
 * Every method delegates to a SECURITY DEFINER SQL function (migration 0004) so
 * the atomic `used < allowance` guarantee lives in the database, not here. This
 * is the only correct place to enforce the quota — frontend checks are advisory
 * (decision E). The injected client should be a trusted server client.
 */

interface EntitlementRow {
  member_id: string;
  period: string;
  plan_code: PlanCode;
  allowance: number;
  used: number;
}

function mapRow(row: EntitlementRow): MonthlyEntitlement {
  return {
    memberId: row.member_id,
    period: row.period,
    planCode: row.plan_code,
    allowance: row.allowance,
    used: row.used,
  };
}

export class SupabaseEntitlementsRepository implements EntitlementsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async ensure(
    memberId: string,
    period: string,
    plan: PlanCode = "TRIAL_1_MONTH",
  ): Promise<MonthlyEntitlement> {
    const { data, error } = await this.client.rpc("ensure_entitlement", {
      p_member: memberId,
      p_period: period,
      p_plan: plan,
    });
    if (error) throw new Error(error.message);
    return mapRow(data as EntitlementRow);
  }

  async claim(memberId: string, period: string, submissionId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc("claim_entitlement", {
      p_member: memberId,
      p_period: period,
      p_submission: submissionId,
    });
    if (error) throw new Error(error.message);
    return data === true;
  }

  async release(submissionId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc("release_entitlement", {
      p_submission: submissionId,
    });
    if (error) throw new Error(error.message);
    return data === true;
  }

  async grant(
    memberId: string,
    period: string,
    amount: number,
    reason: string,
    grantedBy: string,
  ): Promise<MonthlyEntitlement> {
    const { data, error } = await this.client.rpc("grant_entitlement", {
      p_member: memberId,
      p_period: period,
      p_amount: amount,
      p_reason: reason,
      p_by: grantedBy,
    });
    if (error) throw new Error(error.message);
    return mapRow(data as EntitlementRow);
  }
}
