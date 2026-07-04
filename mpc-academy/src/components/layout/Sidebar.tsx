"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "@/lib/constants";
import { APP } from "@/lib/config";
import { getCurrentUser } from "@/lib/access";
import { cn } from "@/lib/utils";

/** Persistent left navigation. Hidden below the `lg` breakpoint. */
export function Sidebar() {
  const pathname = usePathname();

  // AUTH (future): replace the mock user with the real session user.
  const user = getCurrentUser();
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
          active
            ? "bg-brand-tint font-semibold text-brand"
            : "text-ink hover:bg-background",
        )}
      >
        <item.icon
          size={19}
          className={active ? "text-brand" : "text-muted"}
        />
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      {/* Brand mark */}
      <Link href="/" className="mb-6 flex items-center gap-3 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-lg font-extrabold text-gold">
          {APP.shortName[0]}
        </span>
        <span className="text-[15px] font-bold leading-tight">
          {APP.name.split(" ")[0]}
          <br />
          <span className="text-[11px] font-medium text-muted">
            {APP.name.split(" ").slice(1).join(" ")}
          </span>
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        {PRIMARY_NAV.filter((i) => i.id !== "settings").map((item) => (
          <NavLink key={item.id} item={item} />
        ))}

        <div className="my-2 h-px bg-line" />

        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.id} item={item} />
        ))}

        <div className="mt-auto" />
        {PRIMARY_NAV.filter((i) => i.id === "settings").map((item) => (
          <NavLink key={item.id} item={item} />
        ))}
      </nav>

      {/* Mock signed-in identity (no real auth yet — see @/lib/access) */}
      <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
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
