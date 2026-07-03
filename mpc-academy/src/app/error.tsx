"use client";

import { Button } from "@/components/ui";

/** Route error boundary. Errors give direction, not apologies. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-[15px] text-muted">
        That view didn&apos;t load. Try again — if it keeps happening, refresh
        the page.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
