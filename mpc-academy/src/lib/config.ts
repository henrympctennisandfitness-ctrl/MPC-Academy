/**
 * Central app configuration.
 * Single source of truth for branding, external endpoints and feature flags.
 * Keep environment-specific values in `.env.local` (see `.env.example`).
 */

export const APP = {
  name: "MPC Academy",
  shortName: "MPC",
  description: "Your premium coaching membership.",
  tagline: "Train with intent.",
} as const;

/**
 * Google integration (no backend).
 * Point `appsScriptUrl` at a deployed Apps Script Web App that acts as the whole
 * backend — it reads and writes rows in the Google Sheet named `sheetName`
 * inside the spreadsheet `spreadsheetId`. Empty strings = not configured yet
 * (the app then runs against an in-memory mock so development still works).
 *
 * Phase 1 is Google Sheets ONLY — videos are not uploaded yet; the submission
 * stores the chosen video's filename + a placeholder so Drive can be wired in
 * later without touching the UI. See src/services/google/.
 */
export const GOOGLE_CONFIG = {
  appsScriptUrl: process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL ?? "",
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ?? "",
  sheetName: process.env.NEXT_PUBLIC_GOOGLE_SHEET_NAME ?? "Submissions",
  maxUploadBytes: 2 * 1024 * 1024 * 1024, // 2GB
  acceptedVideo: ["video/mp4", "video/quicktime", "video/mpeg"] as const,
} as const;

/**
 * Feature flags — everything ships off until the feature is built.
 * Gate future work behind these so the scaffold stays clean.
 */
export const FEATURES = {
  auth: false,
  billing: false, // Stripe
  aiCoaching: false, // AI technique analysis
  coachMessaging: false,
  videoAnnotations: false,
  voiceoverFeedback: false,
  progressGraphs: false,
  pushNotifications: false,
  tournamentStats: false,
  wearableIntegration: false,
  achievements: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
