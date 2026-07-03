"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { CoachShell } from "@/features/coach";

/**
 * Chooses the app chrome based on the route:
 *   /coach/*  → CoachShell  (coach sidebar + bottom nav + submission store)
 *   else      → AppShell    (member portal shell)
 *
 * This keeps the two areas fully separate without a route-group refactor.
 */
export function RootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCoach = pathname === "/coach" || pathname.startsWith("/coach/");

  if (isCoach) return <CoachShell>{children}</CoachShell>;
  return <AppShell>{children}</AppShell>;
}
