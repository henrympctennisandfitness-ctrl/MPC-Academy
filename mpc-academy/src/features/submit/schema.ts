import { z } from "zod";
import { GOOGLE_CONFIG } from "@/lib/config";
import { ANALYSIS_VALUES, GOAL_VALUES } from "./options";

/**
 * Persisted, serialisable metadata about the chosen video.
 * The actual File object can't be stored in localStorage, so we keep this and
 * treat a restored session's clip as "already uploaded".
 */
export const fileMetaSchema = z.object({
  name: z.string(),
  size: z.number().max(GOOGLE_CONFIG.maxUploadBytes),
  type: z.string(),
});
export type FileMeta = z.infer<typeof fileMetaSchema>;

/** Zod validation for a dropped file (type + size). Used at drop time. */
export const droppedFileSchema = z.object({
  type: z
    .string()
    .refine((t) => (GOOGLE_CONFIG.acceptedVideo as readonly string[]).includes(t), {
      message: "That format isn't supported. Use MP4, MOV or MPEG.",
    }),
  size: z.number().max(GOOGLE_CONFIG.maxUploadBytes, {
    message: "That video is over the 2GB limit. Try trimming it first.",
  }),
});

/** The full, valid submission — checked before we hand off to the coach. */
export const submissionSchema = z.object({
  analysisType: z.enum(ANALYSIS_VALUES as [string, ...string[]]),
  goal: z.enum(GOAL_VALUES as [string, ...string[]]),
  notes: z.string().max(1000).optional(),
  fileMeta: fileMetaSchema,
});

/** Working shape of the wizard — fields start empty and fill in as we go. */
export interface WizardData {
  analysisType: string;
  goal: string;
  notes: string;
  fileMeta: FileMeta | null;
}

export const EMPTY_WIZARD: WizardData = {
  analysisType: "",
  goal: "",
  notes: "",
  fileMeta: null,
};

export const NOTES_MAX = 1000;

/** Ordered step definitions. `key` drives labels; index drives navigation. */
export const STEPS = [
  { key: "type", label: "Analysis" },
  { key: "goal", label: "Goal" },
  { key: "upload", label: "Video" },
  { key: "notes", label: "Notes" },
  { key: "review", label: "Review" },
] as const;

export const STEP_COUNT = STEPS.length; // success screen sits after these

/** Human-readable file size, e.g. 1.4 GB / 320 MB. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}
