"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COACH_NAV } from "../constants";
import { cn } from "@/lib/utils";

/** Fixed bottom navigation for the coach area on mobile. Hidden at `lg`. */
export function CoachBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/coach" ? pathname === "/coach" : pathname.startsWith(href);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/85 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-lg">
        {COACH_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <item.icon
                size={22}
                strokeWidth={active ? 2.4 : 2}
                className={active ? "text-brand" : "text-muted"}
              />
              <span
                className={cn(
                  "text-[10.5px]",
                  active ? "font-semibold text-brand" : "font-medium text-muted",
                )}
              >
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
