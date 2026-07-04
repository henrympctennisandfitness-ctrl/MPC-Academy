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
import {
  fetchSubmissions,
  updateStatus as apiUpdateStatus,
  updateFeedback as apiUpdateFeedback,
  updateProgressRating as apiUpdateProgressRating,
} from "@/services/google";
import {
  type CoachSubmission,
  type CoachMember,
  type SubmissionStatus,
} from "./data";
import { toCoachSubmission, deriveMembers } from "./adapters";

interface CoachContextValue {
  submissions: CoachSubmission[];
  members: CoachMember[];
  counts: { today: number; pending: number; completed: number; members: number };
  loading: boolean;
  error: string | null;
  /** Reload from Google Sheets. */
  refresh: () => Promise<void>;
  /** Update a submission's status; returns false (and reverts) on failure. */
  setStatus: (id: string, status: SubmissionStatus) => Promise<boolean>;
  /** Return feedback (+ optional coach notes) and mark complete. */
  returnFeedback: (
    id: string,
    feedback: string,
    coachNotes?: string,
  ) => Promise<boolean>;
  /** Save the 0–100 progress rating; false (and reverts) on failure. */
  setProgressRating: (id: string, rating: number) => Promise<boolean>;
}

const CoachContext = createContext<CoachContextValue | null>(null);

/**
 * Provides coach submission state to every screen under /coach. Submissions are
 * loaded live from Google Sheets; every coach action writes straight back to
 * the Sheet, with an optimistic UI update that reverts if the write fails.
 */
export function CoachProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<CoachSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    const res = await fetchSubmissions();
    if (res.ok && res.data) {
      setSubmissions(res.data.map(toCoachSubmission));
    } else {
      setError(res.error ?? "Couldn't load submissions.");
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = useCallback(
    async (id: string, status: SubmissionStatus) => {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s)),
      );
      const res = await apiUpdateStatus(id, status);
      if (!res.ok) {
        await load(true); // reload truth from the Sheet
        return false;
      }
      return true;
    },
    [load],
  );

  const returnFeedback = useCallback(
    async (id: string, feedback: string, coachNotes?: string) => {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                feedback,
                ...(coachNotes !== undefined ? { coachNotes } : {}),
                status: "Completed",
              }
            : s,
        ),
      );
      const res = await apiUpdateFeedback(id, feedback, coachNotes);
      if (!res.ok) {
        await load(true);
        return false;
      }
      return true;
    },
    [load],
  );

  const setProgressRating = useCallback(
    async (id: string, rating: number) => {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, progressRating: rating } : s)),
      );
      const res = await apiUpdateProgressRating(id, rating);
      if (!res.ok) {
        await load(true);
        return false;
      }
      return true;
    },
    [load],
  );

  const members = useMemo(() => deriveMembers(submissions), [submissions]);

  const counts = useMemo(
    () => ({
      today: submissions.filter((s) => s.today && s.status !== "Completed").length,
      pending: submissions.filter((s) => s.status !== "Completed").length,
      completed: submissions.filter((s) => s.status === "Completed").length,
      members: members.length,
    }),
    [submissions, members],
  );

  const value = useMemo(
    () => ({
      submissions,
      members,
      counts,
      loading,
      error,
      refresh: () => load(),
      setStatus,
      returnFeedback,
      setProgressRating,
    }),
    [
      submissions,
      members,
      counts,
      loading,
      error,
      load,
      setStatus,
      returnFeedback,
      setProgressRating,
    ],
  );

  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>;
}

export function useCoach(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error("useCoach must be used within a CoachProvider");
  return ctx;
}
