"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { useCoach } from "../store";
import { StatusPill } from "./StatusPill";
import type { CoachMember } from "../data";

/** Coach-facing profile/history link for a member. */
function memberHref(member: CoachMember): string {
  return `/coach/members/${encodeURIComponent(member.id)}`;
}

function submissionsLabel(n: number): string {
  return `${n} submission${n === 1 ? "" : "s"}`;
}

/** Compact row for the dashboard side-panel. */
function MemberRowCompact({ member }: { member: CoachMember }) {
  return (
    <Link
      href={memberHref(member)}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-background"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-[13px] font-semibold text-brand">
        {member.initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold leading-tight">
          {member.name}
        </p>
        <p className="truncate text-[12.5px] text-muted">
          {member.membershipId} · {submissionsLabel(member.submissionCount)}
        </p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-muted" />
    </Link>
  );
}

/** Full member card: identity + aggregated activity + link to their history. */
function MemberCard({ member }: { member: CoachMember }) {
  return (
    <Link
      href={memberHref(member)}
      className="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-background"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-[13px] font-semibold text-brand">
        {member.initials}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold leading-tight">
          {member.name}
        </p>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">
          {member.membershipId} · Academy Member
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusPill status={member.latestStatus} />
          <span className="text-[12px] text-muted">
            {submissionsLabel(member.submissionCount)} · latest {member.latestDateLabel}
          </span>
        </div>
      </div>

      <ChevronRight
        size={18}
        className="mt-0.5 shrink-0 text-muted transition-colors group-hover:text-brand"
      />
    </Link>
  );
}

/**
 * Members list. `compact` renders the dashboard side-panel (top few, linked to
 * the full view); otherwise it's the full searchable page. Every member appears
 * exactly once — submissions are deduplicated into a single card upstream
 * (see `deriveMembers`).
 */
export function MembersView({ compact = false }: { compact?: boolean }) {
  const { members } = useCoach();
  const [query, setQuery] = useState("");

  if (compact) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Recent members</h2>
          <Link
            href="/coach/members"
            className="flex items-center gap-0.5 text-[13px] font-medium text-brand hover:underline"
          >
            All <ChevronRight size={15} />
          </Link>
        </div>
        <div className="space-y-0.5">
          {members.slice(0, 5).map((m) => (
            <MemberRowCompact key={m.id} member={m} />
          ))}
        </div>
      </section>
    );
  }

  const filtered = members.filter(
    (m) =>
      query.trim() === "" ||
      `${m.name} ${m.membershipId} ${m.email}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-[26px] font-bold tracking-tight">Members</h1>
        <p className="mt-1 text-[15px] text-muted">
          Everyone in your academy roster — one card per member.
        </p>
      </header>

      <div className="relative mb-5 max-w-md">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members…"
          aria-label="Search members"
          className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-[14.5px] outline-none transition-shadow placeholder:text-[#9aa1ab] focus:border-brand focus:shadow-[0_0_0_4px_rgba(14,77,58,0.08)]"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-2 rounded-2xl border border-line bg-surface p-2 shadow-card sm:grid-cols-2">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="text-[15px] font-semibold">No members yet</p>
          <p className="mt-1 text-[13.5px] text-muted">
            {query
              ? "No members match your search."
              : "Members appear here once they submit an analysis."}
          </p>
        </div>
      )}
    </div>
  );
}
