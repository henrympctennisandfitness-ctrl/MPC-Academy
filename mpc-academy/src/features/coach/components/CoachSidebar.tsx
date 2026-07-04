"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COACH_NAV } from "../constants";
import { useCoach } from "../store";
import { getCurrentUser } from "@/lib/access";
import { cn } from "@/lib/utils";

/** Persistent left navigation for the coach area. Hidden below `lg`. */
export function CoachSidebar() {
  const pathname = usePathname();
  const { counts } = useCoach();

  // AUTH (future): replace the mock user with the real session user.
  const user = getCurrentUser();
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  const isActive = (href: string) =>
    href === "/coach" ? pathname === "/coach" : pathname.startsWith(href);

  const badge = (id: string) =>
    id === "today" ? counts.today : id === "pending" ? counts.pending : undefined;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface px-3.5 py-6 lg:flex">
      {/* Brand */}
      <div className="mb-6 flex items-center gap-2.5 px-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-lg font-extrabold text-gold">
          M
        </span>
        <span className="text-[15px] font-bold leading-tight">
          MPC
          <br />
          <span className="text-[11px] font-medium text-muted">Coach Studio</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Reviews
        </p>
        {COACH_NAV.map((item) => {
          const active = isActive(item.href);
          const count = badge(item.id);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] transition-colors",
                active
                  ? "bg-brand-tint font-semibold text-brand"
                  : "text-ink hover:bg-background",
              )}
            >
              <item.icon
                size={18}
                className={active ? "text-brand" : "text-muted"}
              />
              <span className="flex-1">{item.label}</span>
              {count ? (
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold",
                    active ? "bg-brand text-white" : "bg-line text-muted",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Mock signed-in coach (no real auth yet — see @/lib/access) */}
      <div className="mt-auto flex items-center gap-3 border-t border-line px-2.5 pt-4">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{user.name}</p>
          <p className="text-[11px] text-muted">{user.roleLabel}</p>
        </div>
      </div>
    </aside>
  );
}
