import type { AppRole } from "../identity/roles";

/**
 * Member domain = the app-side view of app_users + user_roles + member_access
 * (migrations 0002). Identity is the internal UUID only (decision C). No email
 * or Squarespace field is part of ownership; contactEmail is optional and, in
 * Phase 1, fictional-only.
 */
export interface Member {
  /** Internal app_users UUID — the stable application identity and ownership key. */
  id: string;
  displayName: string;
  status: "ACTIVE" | "INACTIVE";
  roles: AppRole[];
  /** Membership/access foundation; Phase 2 resolves this from verified Squarespace. */
  accessActive: boolean;
  /** Optional, fictional-only in Phase 1. Never used as identity. */
  contactEmail?: string | null;
}

export interface MembersRepository {
  getById(id: string): Promise<Member | null>;
  /** Coach/admin roster. RLS restricts this to privileged roles in the DB impl. */
  list(): Promise<Member[]>;
}
