"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

/**
 * App chrome: sidebar on desktop, bottom bar on mobile, content in between.
 * Wraps every route via the root layout.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-3xl px-5 pb-28 pt-6 lg:pb-12">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
