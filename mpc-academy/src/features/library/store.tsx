"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { VIDEOS, type Video } from "./data";
import {
  DEFAULT_STATE,
  loadLibrary,
  saveLibrary,
  type LibraryState,
} from "./storage";

interface LibraryContextValue {
  isFavourite: (id: string) => boolean;
  progressOf: (id: string) => number;
  favourites: Video[];
  continueWatching: Video[];
  recentlyWatched: Video[];
  toggleFavourite: (id: string) => void;
  /** Simulate watching: advance progress and bump recency. */
  play: (id: string) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

const RECENT_CAP = 12;
const byId = (id: string) => VIDEOS.find((v) => v.id === id);
const resolve = (ids: string[]): Video[] =>
  ids.map(byId).filter((v): v is Video => Boolean(v));

/**
 * Holds the member's library state. Seeds deterministically (DEFAULT_STATE) so
 * server and client first render match, then hydrates from localStorage.
 */
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LibraryState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadLibrary();
    if (stored) setState(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveLibrary(state);
  }, [hydrated, state]);

  const toggleFavourite = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      favourites: s.favourites.includes(id)
        ? s.favourites.filter((f) => f !== id)
        : [id, ...s.favourites],
    }));
  }, []);

  const play = useCallback((id: string) => {
    setState((s) => {
      const current = s.progress[id] ?? 0;
      const next = Math.min(100, current === 0 ? 15 : current + 35);
      return {
        ...s,
        progress: { ...s.progress, [id]: next },
        recent: [id, ...s.recent.filter((r) => r !== id)].slice(0, RECENT_CAP),
      };
    });
  }, []);

  const value = useMemo<LibraryContextValue>(() => {
    const isFavourite = (id: string) => state.favourites.includes(id);
    const progressOf = (id: string) => state.progress[id] ?? 0;
    return {
      isFavourite,
      progressOf,
      favourites: resolve(state.favourites),
      // In-progress only (started but not finished), newest first.
      continueWatching: resolve(state.recent).filter((v) => {
        const p = state.progress[v.id] ?? 0;
        return p > 0 && p < 100;
      }),
      recentlyWatched: resolve(state.recent),
      toggleFavourite,
      play,
    };
  }, [state, toggleFavourite, play]);

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within a LibraryProvider");
  return ctx;
}
