"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Search, Inbox, Loader2, AlertCircle } from "lucide-react";
import { useCoach } from "../store";
import { ANALYSIS_FILTERS } from "../constants";
import { SubmissionCard } from "./SubmissionCard";
import { ReviewDrawer } from "./ReviewDrawer";
import type { CoachSubmission, SubmissionStatus } from "../data";

type Scope = "today" | "pending" | "completed";

interface SubmissionListProps {
  scope: Scope;
  title: string;
  subtitle: string;
}

const STATUS_TABS: Array<"All" | SubmissionStatus> = ["All", "New", "In Review"];

/** Search + filters + submission cards + review drawer for one scope. */
export function SubmissionList({ scope, title, subtitle }: SubmissionListProps) {
  const { submissions, setStatus, loading, error, refresh } = useCoach();

  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [statusTab, setStatusTab] = useState<"All" | SubmissionStatus>("All");
  const [active, setActive] = useState<CoachSubmission | null>(null);
  const [focusFeedback, setFocusFeedback] = useState(false);

  const inScope = useMemo(
    () =>
      submissions
        .filter((s) => {
          if (scope === "today") return s.today && s.status !== "Completed";
          if (scope === "pending") return s.status !== "Completed";
          return s.status === "Completed";
        })
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [submissions, scope],
  );

  const filtered = inScope.filter((s) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q === "" ||
      [s.member.name, s.member.membershipId, s.analysisType, s.goal]
        .join(" ")
        .toLowerCase()
        .includes(q);
    const matchesType = type === "All" || s.analysisType === type;
    const matchesStatus = statusTab === "All" || s.status === statusTab;
    return matchesQuery && matchesType && matchesStatus;
  });

  // Keep the open drawer in sync with the latest store data.
  const activeLive = active
    ? submissions.find((s) => s.id === active.id) ?? null
    : null;

  const openReview = (s: CoachSubmission) => {
    if (s.status === "New") void setStatus(s.id, "In Review");
    setFocusFeedback(false);
    setActive(s);
  };
  const openFeedback = (s: CoachSubmission) => {
    setFocusFeedback(true);
    setActive(s);
  };
  const markComplete = async (s: CoachSubmission) => {
    const ok = await setStatus(s.id, "Completed");
    if (ok) toast.success("Marked complete");
    else toast.error("Couldn't update the submission. Please try again.");
  };

  return (
    <div>
      {/* Heading */}
      <header className="mb-5">
        <h1 className="text-[26px] font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-[15px] text-muted">{subtitle}</p>
      </header>

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member, type or goal…"
            aria-label="Search submissions"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-[14.5px] outline-none transition-shadow placeholder:text-[#9aa1ab] focus:border-brand focus:shadow-[0_0_0_4px_rgba(14,77,58,0.08)]"
          />
        </div>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by analysis type"
          className="h-11 rounded-xl border border-line bg-surface px-3 text-[14.5px] outline-none transition-shadow focus:border-brand focus:shadow-[0_0_0_4px_rgba(14,77,58,0.08)]"
        >
          {ANALYSIS_FILTERS.map((t) => (
            <option key={t} value={t}>
              {t === "All" ? "All types" : t}
            </option>
          ))}
        </select>
      </div>

      {/* Status tabs (not shown for the completed view) */}
      {scope !== "completed" && (
        <div className="mb-5 inline-flex rounded-xl border border-line bg-background p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setStatusTab(t)}
              className={
                "rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors " +
                (statusTab === t
                  ? "bg-surface text-ink shadow-sm"
                  : "text-muted hover:text-ink")
              }
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="grid gap-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[132px] animate-pulse rounded-2xl border border-line bg-surface"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-background">
            <AlertCircle size={22} className="text-muted" />
          </span>
          <p className="text-[15px] font-semibold">Couldn&apos;t load submissions</p>
          <p className="mt-1 text-[13.5px] text-muted">{error}</p>
          <button
            onClick={() => void refresh()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <Loader2 size={15} />
            Try again
          </button>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-3">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.25 }}
            >
              <SubmissionCard
                submission={s}
                onReview={() => openReview(s)}
                onMarkComplete={() => markComplete(s)}
                onReturnFeedback={() => openFeedback(s)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-background">
            <Inbox size={22} className="text-muted" />
          </span>
          <p className="text-[15px] font-semibold">Nothing here</p>
          <p className="mt-1 text-[13.5px] text-muted">
            {query || type !== "All"
              ? "No submissions match your filters."
              : "You're all caught up."}
          </p>
        </div>
      )}

      <ReviewDrawer
        submission={activeLive}
        focusFeedback={focusFeedback}
        onClose={() => setActive(null)}
      />
    </div>
  );
}
