"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { useCoach } from "../store";
import type { CoachMember } from "../data";

function MemberRow({ member }: { member: CoachMember }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-background">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-[13px] font-semibold text-brand">
        {member.initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold leading-tight">
          {member.name}
        </p>
        <p className="truncate text-[12.5px] text-muted">
          {member.membershipId} · {member.submissionCount} submissions
        </p>
      </div>
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={
          member.tier === "Elite"
            ? { background: "#FBF6E7", color: "#8A6D12" }
            : { background: "#F3F4F6", color: "#4B5563" }
        }
      >
        {member.tier}
      </span>
    </div>
  );
}

/**
 * Members list. `compact` renders the dashboard side-panel (top few, linked to
 * the full view); otherwise it's the full searchable page.
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
            <MemberRow key={m.id} member={m} />
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
          Everyone in your academy roster.
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

      <div className="grid gap-2 rounded-2xl border border-line bg-surface p-2 shadow-card sm:grid-cols-2">
        {filtered.map((m) => (
          <MemberRow key={m.id} member={m} />
        ))}
      </div>
    </div>
  );
}
