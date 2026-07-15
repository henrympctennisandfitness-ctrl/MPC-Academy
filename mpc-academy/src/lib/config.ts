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
 * Videos upload DIRECTLY to Google Drive from the browser (resumable upload API,
 * up to 3GB) — never through Apps Script. Apps Script only records metadata (the
 * Drive URL + filename) in the Sheet. See src/services/google/drive.ts.
 */
export const GOOGLE_CONFIG = {
  appsScriptUrl: process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL ?? "",
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID ?? "",
  sheetName: process.env.NEXT_PUBLIC_GOOGLE_SHEET_NAME ?? "Submissions",

  /**
   * Google OAuth 2.0 Client ID (Web application) used by Google Identity
   * Services to obtain a short-lived Drive access token for the resumable
   * upload. This is Drive AUTHORIZATION only — not app/member login. Empty =
   * uploads are skipped (dev), and only metadata is recorded.
   */
  driveOAuthClientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? "",
  /** Drive folder that holds submission videos (created in the member's Drive). */
  driveRootFolderName:
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_ROOT_FOLDER_NAME ?? "MPC Academy Submissions",
  /** How uploaded videos are shared so coaches can view them. */
  driveSharing: (process.env.NEXT_PUBLIC_GOOGLE_DRIVE_SHARING ??
    "ANYONE_WITH_LINK") as "ANYONE_WITH_LINK" | "DOMAIN" | "PRIVATE",

  /** Max clip size accepted at the dropzone (direct resumable upload). */
  maxUploadBytes: 3 * 1024 * 1024 * 1024, // 3GB
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
