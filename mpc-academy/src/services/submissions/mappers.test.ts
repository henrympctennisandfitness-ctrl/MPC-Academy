import { describe, it, expect } from "vitest";
import { mapRowToSubmission, toInsertPayload, type SubmissionRow } from "./mappers";

const row: SubmissionRow = {
  id: "s-1",
  member_id: "m-1",
  status: "SUBMITTED",
  analysis_type: "Serve",
  goal: "Power",
  notes: null,
  assigned_coach_id: null,
  period: "2026-09-01",
  created_at: "2026-09-15T00:00:00Z",
  updated_at: "2026-09-15T00:00:00Z",
};

describe("submission mappers", () => {
  it("maps a DB row to the domain shape", () => {
    const s = mapRowToSubmission(row);
    expect(s.memberId).toBe("m-1");
    expect(s.status).toBe("SUBMITTED");
    expect(s.analysisType).toBe("Serve");
    expect(s.notes).toBe(""); // null -> ""
    expect(s.period).toBe("2026-09-01");
  });

  it("rejects unknown statuses from the database", () => {
    expect(() => mapRowToSubmission({ ...row, status: "WAT" })).toThrow();
  });

  it("builds a member insert payload without status/coach fields", () => {
    const payload = toInsertPayload({
      memberId: "m-1",
      analysisType: "Serve",
      goal: "Power",
      notes: "hi",
    });
    expect(payload).toEqual({
      member_id: "m-1",
      analysis_type: "Serve",
      goal: "Power",
      notes: "hi",
    });
  });
});
