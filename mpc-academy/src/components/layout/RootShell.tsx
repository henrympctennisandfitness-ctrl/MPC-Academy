"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { CoachAccessDenied } from "./CoachAccessDenied";
import { DevRoleIndicator } from "@/components/DevRoleIndicator";
import { CoachShell } from "@/features/coach";
import { canAccessCoach } from "@/lib/access";

/**
 * Chooses the app chrome based on the route, and gates Coach Studio by role:
 *   /coach/*  → coach access?  CoachShell  :  member shell + Access Denied
 *   else      → AppShell (member portal shell)
 *
 * Access comes from the MOCK current user (@/lib/access). There is no real auth
 * yet, so this guard is client-side only.
 *
 * AUTH (future): replace canAccessCoach() with the real session role, and add
 * server-side enforcement (middleware) so /coach is protected at the edge.
 */
export function RootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCoach = pathname === "/coach" || pathname.startsWith("/coach/");

  let content: ReactNode;
  if (isCoach) {
    content = canAccessCoach() ? (
      <CoachShell>{children}</CoachShell>
    ) : (
      <AppShell>
        <CoachAccessDenied />
      </AppShell>
    );
  } else {
    content = <AppShell>{children}</AppShell>;
  }

  return (
    <>
      {content}
      <DevRoleIndicator />
    </>
  );
}
