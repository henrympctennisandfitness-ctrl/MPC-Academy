"use client";

import Link from "next/link";
import { Inbox, Clock3, CheckCircle2, Users, type LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/access";
import { useCoach } from "../store";
import { SubmissionList } from "./SubmissionList";
import { MembersView } from "./MembersView";

interface Stat {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <Link
      href={stat.href}
      className="group rounded-2xl border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-tint">
        <stat.icon size={18} className="text-brand" />
      </span>
      <p className="mt-3 text-[26px] font-bold leading-none tabular-nums">
        {stat.value}
      </p>
      <p className="mt-1 text-[13px] text-muted">{stat.label}</p>
    </Link>
  );
}

/** Coach landing view: overview stats + today's queue + recent members. */
export function CoachHome() {
  const { counts } = useCoach();
  const firstName = getCurrentUser().name.split(" ")[0];

  const stats: Stat[] = [
    { label: "Today's queue", value: counts.today, href: "/coach", icon: Inbox },
    { label: "Pending reviews", value: counts.pending, href: "/coach/pending", icon: Clock3 },
    { label: "Completed", value: counts.completed, href: "/coach/completed", icon: CheckCircle2 },
    { label: "Members", value: counts.members, href: "/coach/members", icon: Users },
  ];

  return (
    <div>
      <p className="mb-4 text-[14px] text-muted">
        Good morning, {firstName} — here&apos;s what&apos;s waiting.
      </p>

      {/* Overview */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      {/* Queue + members */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SubmissionList
            scope="today"
            title="Today's Queue"
            subtitle="New clips that came in today, waiting on you."
          />
        </div>
        <aside className="lg:col-span-1">
          <MembersView compact />
        </aside>
      </div>
    </div>
  );
}
