/**
 * Library state persistence (favourites, watch progress, recency).
 * Mirrors the submit feature's SSR-safe pattern. Falls back to sensible demo
 * defaults on first visit so the shelves feel alive rather than empty.
 */

export interface LibraryState {
  favourites: string[];
  progress: Record<string, number>; // videoId → 0–100
  recent: string[]; // most-recent-first videoIds
}

const KEY = "mpc:library:v1";

/** First-run seed so Continue watching / Recently watched aren't empty. */
export const DEFAULT_STATE: LibraryState = {
  favourites: ["serve-2", "mental-1"],
  progress: { "serve-1": 45, "fitness-1": 70 },
  recent: ["serve-1", "fitness-1", "mental-1", "forehand-2"],
};

/** Read stored state. Returns null on the server or when nothing is stored. */
export function loadLibrary(): LibraryState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LibraryState>;
    return {
      favourites: parsed.favourites ?? [],
      progress: parsed.progress ?? {},
      recent: parsed.recent ?? [],
    };
  } catch {
    return null;
  }
}

/** Persist state. Silently no-ops if storage is unavailable. */
export function saveLibrary(state: LibraryState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — non-critical */
  }
}
