/**
 * Google Sheets backend — configuration.
 * ---------------------------------------------------------------------------
 * The single, easy-to-replace place that names WHERE the data lives:
 *   • appsScriptUrl  — the deployed Apps Script Web App (the whole backend)
 *   • spreadsheetId  — the Google Sheet that stores every submission
 *   • sheetName      — the tab within that spreadsheet
 *
 * All three come from environment variables (see `.env.example`) via the shared
 * `GOOGLE_CONFIG` in `src/lib/config.ts`, so there is a single source of truth.
 * When none is set the service falls back to an in-memory mock (see mock.ts) so
 * the app is fully usable in development without any Google setup.
 */

import { GOOGLE_CONFIG } from "@/lib/config";

export const GOOGLE_SHEETS_CONFIG = {
  appsScriptUrl: GOOGLE_CONFIG.appsScriptUrl,
  spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
  sheetName: GOOGLE_CONFIG.sheetName,
} as const;

/**
 * True when a real Apps Script endpoint is configured. When false the service
 * transparently uses the in-memory mock so development never blocks on setup.
 */
export function isSheetsConfigured(): boolean {
  return GOOGLE_SHEETS_CONFIG.appsScriptUrl.trim() !== "";
}
