import { z } from "zod";

/**
 * Server-side input validation for submission creation. Phase 1 defines the
 * boundary; Phase 3 wires it into the real create flow. Validation must run on
 * the server/DB path — never trust the client.
 */

export const ANALYSIS_TYPES = [
  "Serve",
  "Forehand",
  "Backhand",
  "Volley",
  "Slice",
  "Match Play",
  "Doubles",
  "Mental Performance",
  "Other",
] as const;

export const GOALS = [
  "Consistency",
  "Power",
  "Technique",
  "Footwork",
  "Spin",
  "Confidence",
  "Match Tactics",
  "Other",
] as const;

export const NOTES_MAX = 1000;

export const createSubmissionSchema = z.object({
  analysisType: z.enum(ANALYSIS_TYPES),
  goal: z.enum(GOALS),
  notes: z.string().max(NOTES_MAX).default(""),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
