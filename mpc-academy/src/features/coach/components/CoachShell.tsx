"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Toaster } from "sonner";
import { CoachProvider } from "../store";
import { CoachSidebar } from "./CoachSidebar";
import { CoachBottomNav } from "./CoachBottomNav";

/**
 * Coach-area chrome: left sidebar on desktop, bottom bar on mobile, with the
 * shared submission store wrapped around the content. Rendered by RootShell
 * for any /coach route so the member portal keeps its own shell.
 */
export function CoachShell({ children }: { children: ReactNode }) {
  return (
    <CoachProvider>
      <div className="min-h-screen">
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <CoachSidebar />

        <div className="lg:pl-64">
          <main className="mx-auto w-full max-w-5xl px-5 pb-28 pt-6 lg:px-8 lg:pb-12">
            {/* Clear route back to the member portal */}
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-ink"
            >
              <ChevronLeft size={15} />
              Back to Member Dashboard
            </Link>

            {children}
          </main>
        </div>

        <CoachBottomNav />
      </div>
    </CoachProvider>
  );
}
