"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { CoachAccessDenied } from "./CoachAccessDenied";
import { CoachShell } from "@/features/coach";
import { hasCoachAccess } from "@/lib/access";

/**
 * Chooses the app chrome based on the route, and gates Coach Studio:
 *   /coach/*  → coach access?  CoachShell  :  member shell + Access Denied
 *   else      → AppShell (member portal shell)
 *
 * The coach guard is a mock (client-side, based on @/lib/access). It keeps the
 * UI honest for now; real enforcement should move to server middleware when
 * authentication is added.
 */
export function RootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCoach = pathname === "/coach" || pathname.startsWith("/coach/");

  if (isCoach) {
    if (!hasCoachAccess()) {
      return (
        <AppShell>
          <CoachAccessDenied />
        </AppShell>
      );
    }
    return <CoachShell>{children}</CoachShell>;
  }

  return <AppShell>{children}</AppShell>;
}
