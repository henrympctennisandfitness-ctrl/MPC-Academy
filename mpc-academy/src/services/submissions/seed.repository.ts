import type { Submission, SubmissionStatus, SubmissionsRepository } from "./types";
import { DEV_SUBMISSIONS } from "../database/devFixtures";

/**
 * Seed/dev implementation of SubmissionsRepository. This is the "legacy/seed"
 * side of the migration seam — it lets the app and tests use the repository
 * interface without a live Supabase project. Client-safe (no DB imports).
 */
export class SeedSubmissionsRepository implements SubmissionsRepository {
  constructor(private readonly data: Submission[] = DEV_SUBMISSIONS) {}

  async listByMember(memberId: string): Promise<Submission[]> {
    return this.data.filter((s) => s.memberId === memberId);
  }

  async getById(id: string): Promise<Submission | null> {
    return this.data.find((s) => s.id === id) ?? null;
  }

  async listForCoach(status?: SubmissionStatus): Promise<Submission[]> {
    return status ? this.data.filter((s) => s.status === status) : [...this.data];
  }
}
