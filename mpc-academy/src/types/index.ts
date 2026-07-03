/**
 * Shared domain types.
 * These describe the shapes features will use later — no data or logic here.
 */

export interface Member {
  id: string;
  firstName: string;
  fullName: string;
  email: string;
  membershipId: string;
  tier: "Standard" | "Elite";
}

export type AnalysisType =
  | "Serve"
  | "Forehand"
  | "Backhand"
  | "Volley"
  | "Slice"
  | "Match Play"
  | "Doubles"
  | "Mental Performance"
  | "Other";

export type Objective =
  | "Consistency"
  | "Power"
  | "Technique"
  | "Footwork"
  | "Tactics"
  | "Spin"
  | "Confidence"
  | "Other";

export type AnalysisStatus = "submitted" | "in_review" | "reviewed";

export interface Analysis {
  id: string;
  date: string;
  type: AnalysisType;
  objective: Objective;
  coach?: string;
  status: AnalysisStatus;
  notes?: string;
}
