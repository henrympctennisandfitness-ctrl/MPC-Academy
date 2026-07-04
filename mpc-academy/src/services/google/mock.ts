/**
 * Google Sheets backend — in-memory mock.
 * ---------------------------------------------------------------------------
 * Used automatically when no Apps Script URL is configured (see config.ts), so
 * the whole app — submit, coach dashboard, member progress — is fully usable in
 * development with zero Google setup. It behaves like the real Sheet: reads,
 * creates and updates all work, and (in the browser) survive a refresh via
 * localStorage, mirroring "the page reflects coach updates after refresh".
 *
 * This is dev scaffolding only. In production a real Apps Script URL is set and
 * none of this code path runs.
 */

import type { Submission } from "./types";

const STORAGE_KEY = "mpc:mock-submissions";

/** Hours-ago ISO timestamp, so the "today" seed rows track the real clock. */
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

/** A small, realistic seed so every surface has content out of the box. */
function seed(): Submission[] {
  return [
    {
      id: "MPC-SEED-0001",
      timestamp: hoursAgo(2),
      memberName: "Henry Walsh",
      memberEmail: "henry.walsh@example.com",
      membershipId: "MPC-2041",
      analysisType: "Serve",
      goal: "Power",
      notes:
        "Second serve keeps dropping into the net under pressure — would love a look at my toss.",
      status: "New",
      assignedCoach: "",
      coachFeedback: "",
      coachNotes: "",
      completionDate: "",
      progressRating: "",
      videoFilename: "serve-practice.mp4",
      videoPlaceholder: "PENDING_DRIVE_UPLOAD",
    },
    {
      id: "MPC-SEED-0002",
      timestamp: hoursAgo(4),
      memberName: "Priya Sharma",
      memberEmail: "priya.sharma@example.com",
      membershipId: "MPC-1187",
      analysisType: "Backhand",
      goal: "Consistency",
      notes: "Two-hander feels late on faster balls. Timing help please.",
      status: "New",
      assignedCoach: "",
      coachFeedback: "",
      coachNotes: "",
      completionDate: "",
      progressRating: "",
      videoFilename: "backhand-rally.mov",
      videoPlaceholder: "PENDING_DRIVE_UPLOAD",
    },
    {
      id: "MPC-SEED-0003",
      timestamp: hoursAgo(6),
      memberName: "Marcus Delaney",
      memberEmail: "marcus.d@example.com",
      membershipId: "MPC-2298",
      analysisType: "Match Play",
      goal: "Tactics",
      notes: "Full set from Sunday's club match — struggled to close it out at 5-3.",
      status: "In Review",
      assignedCoach: "Coach Marta",
      coachFeedback: "",
      coachNotes: "Watch the forehand decision at 4-3, deuce.",
      completionDate: "",
      progressRating: "",
      videoFilename: "club-match-set.mp4",
      videoPlaceholder: "PENDING_DRIVE_UPLOAD",
    },
    {
      id: "MPC-SEED-0004",
      timestamp: "2026-06-24T10:00:00.000Z",
      memberName: "Henry Walsh",
      memberEmail: "henry.walsh@example.com",
      membershipId: "MPC-2041",
      analysisType: "Slice",
      goal: "Technique",
      notes: "Backhand slice floating long.",
      status: "Completed",
      assignedCoach: "Coach Marta",
      coachFeedback:
        "Great progress. Keep the racket-face a touch more closed and finish out front — sent 3 drills.",
      coachNotes: "Ready to add slice approach into match play next block.",
      completionDate: "2026-06-25T14:12:00.000Z",
      progressRating: 78,
      videoFilename: "slice-drill.mp4",
      videoPlaceholder: "PENDING_DRIVE_UPLOAD",
    },
    {
      id: "MPC-SEED-0005",
      timestamp: "2026-06-11T11:30:00.000Z",
      memberName: "Henry Walsh",
      memberEmail: "henry.walsh@example.com",
      membershipId: "MPC-2041",
      analysisType: "Backhand",
      goal: "Consistency",
      notes: "Backhand breaking down late in rallies.",
      status: "Completed",
      assignedCoach: "Coach Dan",
      coachFeedback:
        "Great extension through the ball. Close the racket face a touch earlier and you'll stop floating it long.",
      coachNotes: "",
      completionDate: "2026-06-12T09:40:00.000Z",
      progressRating: 68,
      videoFilename: "backhand-consistency.mov",
      videoPlaceholder: "PENDING_DRIVE_UPLOAD",
    },
    {
      id: "MPC-SEED-0006",
      timestamp: "2026-06-02T16:45:00.000Z",
      memberName: "Henry Walsh",
      memberEmail: "henry.walsh@example.com",
      membershipId: "MPC-2041",
      analysisType: "Serve",
      goal: "Power",
      notes: "Chasing a bit more free pace on the first serve.",
      status: "Completed",
      assignedCoach: "Coach Marta",
      coachFeedback:
        "Toss is far more consistent. Keep the tossing arm up a beat longer and you'll gain easy power without swinging harder.",
      coachNotes: "",
      completionDate: "2026-06-03T08:15:00.000Z",
      progressRating: 82,
      videoFilename: "first-serve.mp4",
      videoPlaceholder: "PENDING_DRIVE_UPLOAD",
    },
  ];
}

/** Load the mock table (from localStorage in the browser, seeding once). */
function load(): Submission[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Submission[];
  } catch {
    // Corrupt/blocked storage — fall through to a fresh seed.
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
