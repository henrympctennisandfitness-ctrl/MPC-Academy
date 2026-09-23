import type { Member, MembersRepository } from "./types";
import { DEV_ROLES, DEV_USER_IDS } from "../database/devFixtures";

/**
 * Fictional seed members (decision 5: no real member data in Phase 1). These
 * mirror supabase/seed.sql. Client-safe; used by the migration seam and tests.
 */
export const DEV_MEMBERS: Member[] = [
  {
    id: DEV_USER_IDS.coachHenry,
    displayName: "Coach Alex (dev)",
    status: "ACTIVE",
    roles: DEV_ROLES[DEV_USER_IDS.coachHenry],
    accessActive: true,
    contactEmail: null,
  },
  {
    id: DEV_USER_IDS.coachCalum,
    displayName: "Coach Sam (dev)",
    status: "ACTIVE",
    roles: DEV_ROLES[DEV_USER_IDS.coachCalum],
    accessActive: true,
    contactEmail: null,
  },
  {
    id: DEV_USER_IDS.memberOne,
    displayName: "Member One (dev)",
    status: "ACTIVE",
    roles: DEV_ROLES[DEV_USER_IDS.memberOne],
    accessActive: true,
    contactEmail: null,
  },
  {
    id: DEV_USER_IDS.memberTwo,
    displayName: "Member Two (dev)",
    status: "ACTIVE",
    roles: DEV_ROLES[DEV_USER_IDS.memberTwo],
    accessActive: true,
    contactEmail: null,
  },
];

export class SeedMembersRepository implements MembersRepository {
  constructor(private readonly data: Member[] = DEV_MEMBERS) {}

  async getById(id: string): Promise<Member | null> {
    return this.data.find((m) => m.id === id) ?? null;
  }

  async list(): Promise<Member[]> {
    return [...this.data];
  }
}
