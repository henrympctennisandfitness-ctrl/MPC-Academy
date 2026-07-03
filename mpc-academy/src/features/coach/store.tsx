"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SUBMISSIONS,
  MEMBERS,
  type CoachSubmission,
  type CoachMember,
  type SubmissionStatus,
} from "./data";

interface CoachContextValue {
  submissions: CoachSubmission[];
  members: CoachMember[];
  counts: { today: number; pending: number; completed: number; members: number };
  setStatus: (id: string, status: SubmissionStatus) => void;
  returnFeedback: (id: string, feedback: string) => void;
}

const CoachContext = createContext<CoachContextValue | null>(null);

/**
 * Provides coach submission state to every screen under /coach so a status
 * change on one view is reflected on the others within the session.
 */
export function CoachProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<CoachSubmission[]>(SUBMISSIONS);

  const setStatus = useCallback((id: string, status: SubmissionStatus) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );
  }, []);

  const returnFeedback = useCallback((id: string, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, feedback, status: "Completed" } : s,
      ),
    );
  }, []);

  const counts = useMemo(
    () => ({
      today: submissions.filter((s) => s.today && s.status !== "Completed").length,
      pending: submissions.filter((s) => s.status !== "Completed").length,
      completed: submissions.filter((s) => s.status === "Completed").length,
      members: MEMBERS.length,
    }),
    [submissions],
  );

  const value = useMemo(
    () => ({ submissions, members: MEMBERS, counts, setStatus, returnFeedback }),
    [submissions, counts, setStatus, returnFeedback],
  );

  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>;
}

export function useCoach(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error("useCoach must be used within a CoachProvider");
  return ctx;
}
