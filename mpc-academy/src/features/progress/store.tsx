"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSubmissionsByEmail, type Submission } from "@/services/google";
import { CURRENT_MEMBER } from "@/lib/member";

/** A completed review as shown on the member's coaching-history timeline. */
export interface MemberSession {
  id: string;
  analysisType: string;
  goal: string;
  /** Deterministic label, e.g. "24 Jun 2026". */
  date: string;
  coach: string;
  /** 0–100, or null when the coach hasn't rated it. */
  rating: number | null;
  /** Coach feedback returned to the member. */
  comment: string;
  /** Coach's notes shown alongside the feedback (empty when none). */
  coachNotes: string;
}

export interface MemberProgress {
  /** Completed reviews, newest first (the coaching history). */
  sessions: MemberSession[];
  /** The most recent piece of coach feedback, if any. */
  latestFeedback: MemberSession | null;
  /** Submissions still awaiting feedback (New / In Review). */
  pendingCount: number;
  /** Total submissions on record for this member. */
  totalCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** ISO → "24 Jun 2026" (deterministic — no locale/hydration drift). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function toSession(s: Submission): MemberSession {
  return {
    id: s.id,
    analysisType: s.analysisType,
    goal: s.goal,
    date: formatDate(s.completionDate || s.timestamp),
    coach: s.assignedCoach || "Your coach",
    rating: typeof s.progressRating === "number" ? s.progressRating : null,
    comment: s.coachFeedback || "Feedback coming soon.",
    coachNotes: s.coachNotes || "",
  };
}

/**
 * Loads the signed-in member's submissions from Google Sheets and derives the
 * coaching history shown on My Progress. Reflects coach updates on refresh.
 * (Auth is mocked — the member is `CURRENT_MEMBER`; wire to the session later.)
 */
export function useMemberProgress(): MemberProgress {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchSubmissionsByEmail(CURRENT_MEMBER.email);
    if (res.ok && res.data) setRows(res.data);
    else setError(res.error ?? "Couldn't load your coaching history.");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(() => {
    const sessions = rows
      .filter((s) => s.status === "Completed")
      .map(toSession);
    return {
      sessions,
      latestFeedback: sessions[0] ?? null,
      pendingCount: rows.filter((s) => s.status !== "Completed").length,
      totalCount: rows.length,
      loading,
      error,
      refresh: load,
    };
  }, [rows, loading, error, load]);
}
