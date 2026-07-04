/**
 * Google Sheets backend — in-memory mock.
 * ---------------------------------------------------------------------------
 * Used automatically when no Apps Script URL is configured (see config.ts), so
 * the whole app — submit, coach dashboard, member progress — is usable in
 * development with zero Google setup. It behaves like the real Sheet: reads,
 * creates and updates all work, and (in the browser) survive a refresh via
 * localStorage.
 *
 * The mock starts EMPTY — there is NO fake member, submission or coaching data.
 * Real submissions made through the Submit wizard populate it during a dev
 * session. In production a real Apps Script URL is set and this code never runs.
 */

import type { Submission } from "./types";

// Versioned key: bumping it discards any stale rows a dev browser cached under
// an earlier version (e.g. previous fake seed data).
const STORAGE_KEY = "mpc:mock-submissions:v2";

/** The mock table seeds empty — no fake data. */
function seed(): Submission[] {
  return [];
}

/** Load the mock table (from localStorage in the browser, seeding once). */
function load(): Submission[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Submission[];
  } catch {
    // Corrupt/blocked storage — fall through to a fresh (empty) seed.
  }
  const seeded = seed();
  save(seeded);
  return seeded;
}

/** Persist the mock table (browser only; no-op on the server). */
function save(rows: Submission[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // Storage full/blocked — mock simply won't persist across refreshes.
  }
}

export const mockDb = {
  list(): Submission[] {
    return load();
  },
  create(row: Submission): Submission {
    const rows = load();
    // Duplicate guard — mirror the real backend's behaviour.
    if (rows.some((r) => r.id === row.id)) {
      throw new Error("A submission with this ID already exists.");
    }
    rows.unshift(row);
    save(rows);
    return row;
  },
  update(id: string, patch: Partial<Submission>): Submission {
    const rows = load();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Submission not found: ${id}`);
    rows[idx] = { ...rows[idx], ...patch };
    save(rows);
    return rows[idx];
  },
};
