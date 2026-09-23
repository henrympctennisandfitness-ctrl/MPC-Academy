/**
 * Fictional development fixtures. These MUST stay obviously fake (decision 5:
 * no real member data in Phase 1). They mirror supabase/seed.sql so the seed
 * repository and the seeded dev database line up. Not used by the live UI.
 */
import type { Submission } from "../submissions/types";
import type { AppRole } from "../identity/roles";

export const DEV_USER_IDS = {
  coachHenry: "00000000-0000-4000-8000-000000000001",
  coachCalum: "00000000-0000-4000-8000-000000000002",
  memberOne: "00000000-0000-4000-8000-000000000101",
  memberTwo: "00000000-0000-4000-8000-000000000102",
} as const;

export const DEV_ROLES: Record<string, AppRole[]> = {
  [DEV_USER_IDS.coachHenry]: ["COACH", "ADMIN"],
  [DEV_USER_IDS.coachCalum]: ["COACH", "ADMIN"],
  [DEV_USER_IDS.memberOne]: ["MEMBER"],
  [DEV_USER_IDS.memberTwo]: ["MEMBER"],
};

export const DEV_SUBMISSIONS: Submission[] = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    memberId: DEV_USER_IDS.memberOne,
    status: "SUBMITTED",
    analysisType: "Serve",
    goal: "Power",
    notes: "Please check my toss",
    assignedCoachId: null,
    period: "2026-09-01",
    createdAt: "2026-09-15T00:00:00Z",
    updatedAt: "2026-09-15T00:00:00Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    memberId: DEV_USER_IDS.memberTwo,
    status: "COMPLETED",
    analysisType: "Backhand",
    goal: "Consistency",
    notes: "",
    assignedCoachId: DEV_USER_IDS.coachHenry,
    period: "2026-09-01",
    createdAt: "2026-09-10T00:00:00Z",
    updatedAt: "2026-09-12T00:00:00Z",
  },
];
