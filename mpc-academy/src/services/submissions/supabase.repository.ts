import type { SupabaseClient } from "@supabase/supabase-js";
import type { Submission, SubmissionStatus, SubmissionsRepository } from "./types";
import { mapRowToSubmission, type SubmissionRow } from "./mappers";

/**
 * Supabase implementation of SubmissionsRepository.
 *
 * SERVER-ONLY. It is never imported by client components (the live UI still uses
 * the seed implementation in Phase 1). The client is injected so it can be a
 * server anon client (RLS-scoped) or, for admin tasks, a service-role client —
 * the caller decides. Row access is ultimately governed by RLS (migration 0006).
 */
export class SupabaseSubmissionsRepository implements SubmissionsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listByMember(memberId: string): Promise<Submission[]> {
    const { data, error } = await this.client
      .from("submissions")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as SubmissionRow[]).map(mapRowToSubmission);
  }

  async getById(id: string): Promise<Submission | null> {
    const { data, error } = await this.client
      .from("submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapRowToSubmission(data as SubmissionRow) : null;
  }

  async listForCoach(status?: SubmissionStatus): Promise<Submission[]> {
    let query = this.client.from("submissions").select("*");
    if (status) query = query.eq("status", status);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as SubmissionRow[]).map(mapRowToSubmission);
  }
}
