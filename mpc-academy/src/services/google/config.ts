/**
 * Google backend — configuration.
 * ---------------------------------------------------------------------------
 * Two independent Google integrations, each easy to replace:
 *
 *   Sheets (via Apps Script) — the database + metadata API. Handles submissions,
 *   coach feedback, status and progress ratings. NEVER handles video bytes.
 *
 *   Drive (direct from the browser) — resumable video upload, authorised with a
 *   short-lived OAuth token from Google Identity Services.
 *
 * All values come from environment variables (see `.env.example`) via the shared
 * `GOOGLE_CONFIG` in `src/lib/config.ts`, so there is a single source of truth.
 * When Sheets is unconfigured the service uses an in-memory mock; when Drive is
 * unconfigured the upload step is skipped and only metadata is recorded.
 */

import { GOOGLE_CONFIG } from "@/lib/config";

export const GOOGLE_SHEETS_CONFIG = {
  appsScriptUrl: GOOGLE_CONFIG.appsScriptUrl,
  spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
  sheetName: GOOGLE_CONFIG.sheetName,
} as const;

export const GOOGLE_DRIVE_CONFIG = {
  oauthClientId: GOOGLE_CONFIG.driveOAuthClientId,
  rootFolderName: GOOGLE_CONFIG.driveRootFolderName,
  sharing: GOOGLE_CONFIG.driveSharing,
  maxUploadBytes: GOOGLE_CONFIG.maxUploadBytes,
} as const;

/**
 * True when a real Apps Script endpoint is configured. When false the service
 * transparently uses the in-memory mock so development never blocks on setup.
 */
export function isSheetsConfigured(): boolean {
  return GOOGLE_SHEETS_CONFIG.appsScriptUrl.trim() !== "";
}

/**
 * True when Drive uploads are configured (an OAuth Client ID is present). When
 * false the submit flow skips the upload and records metadata only.
 */
export function isDriveConfigured(): boolean {
  return GOOGLE_DRIVE_CONFIG.oauthClientId.trim() !== "";
}
