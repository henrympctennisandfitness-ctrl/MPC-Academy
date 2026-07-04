import Link from "next/link";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui";

/**
 * Coach Studio entry card for the member dashboard. Render this only when the
 * current user has coach access — see hasCoachAccess() in @/lib/access.
 */
export function CoachStudioCard() {
  return (
    <Link href="/coach" className="block">
      <Card interactive className="flex items-center gap-4 p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-tint">
          <ShieldCheck size={20} className="text-brand" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">Coach Studio</p>
          <p className="text-[13px] text-muted">
            Review member submissions and browse the roster
          </p>
        </div>
        <ChevronRight size={18} className="text-[#C0C6CC]" />
      </Card>
    </Link>
  );
}
