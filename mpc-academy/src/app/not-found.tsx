import Link from "next/link";
import { Button } from "@/components/ui";

/** 404. An empty screen is an invitation to act. */
export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-[15px] text-muted">
        We couldn&apos;t find that page. It may have moved.
      </p>
      <Link href="/" className="mt-6">
        <Button>Back to home</Button>
      </Link>
    </section>
  );
}
