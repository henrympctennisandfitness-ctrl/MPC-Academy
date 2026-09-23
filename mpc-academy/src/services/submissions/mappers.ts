import { SUBMISSION_STATUSES, type Submission, type SubmissionStatus } from "./types";

/** Shape of a `submissions` row as returned by Supabase (snake_case). */
export interface SubmissionRow {
  id: string;
  member_id: string;
  status: string;
  analysis_type: string;
  goal: string;
  notes: string | null;
  assigned_coach_id: string | null;
  period: string | null;
  created_at: string;
  updated_at: string;
}

function toStatus(value: string): SubmissionStatus {
  if ((SUBMISSION_STATUSES as readonly string[]).includes(value)) {
    return value as SubmissionStatus;
  }
  throw new Error(`Unknown submission status from database: ${value}`);
}

export function mapRowToSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    memberId: row.member_id,
    status: toStatus(row.status),
    analysisType: row.analysis_type,
    goal: row.goal,
    notes: row.notes ?? "",
    assignedCoachId: row.assigned_coach_id,
    period: row.period,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Insert payload for creating a member submission (member_id + content only). */
export function toInsertPayload(input: {
  memberId: string;
  analysisType: string;
  goal: string;
  notes: string;
}): Pick<SubmissionRow, "member_id" | "analysis_type" | "goal" | "notes"> {
  return {
    member_id: input.memberId,
    analysis_type: input.analysisType,
    goal: input.goal,
    notes: input.notes,
  };
}
