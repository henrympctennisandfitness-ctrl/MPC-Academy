import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Shown (inside the member shell) when someone without coach access lands on a
 * /coach route. Matches the not-found / error screens in tone.
 */
export function CoachAccessDenied() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-background">
        <ShieldAlert size={28} className="text-muted" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Access denied</h1>
      <p className="mt-2 max-w-sm text-[15px] text-muted">
        Coach Studio is available to academy coaches only.
      </p>
      <Link href="/" className="mt-6">
        <Button>Back to home</Button>
      </Link>
    </section>
  );
}
