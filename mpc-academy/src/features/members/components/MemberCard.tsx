import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui";
import { Avatar } from "./Avatar";

interface MemberCardProps {
  slug: string;
  name: string;
  initials: string;
  membershipId: string;
  level: string;
  favouriteShot: string;
  tier: string;
  /** Link root, so the same card works for member and coach contexts. */
  basePath?: string;
}

/** A single roster entry linking through to the member's profile. */
export function MemberCard({
  slug,
  name,
  initials,
  membershipId,
  level,
  favouriteShot,
  tier,
  basePath = "/members",
}: MemberCardProps) {
  return (
    <Link href={`${basePath}/${slug}`} className="block">
      <Card interactive className="flex items-center gap-4 p-4">
        <Avatar initials={initials} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">{name}</p>
          <p className="truncate text-[12.5px] text-muted">
            {membershipId} · {level}
          </p>
          <p className="mt-1 truncate text-[12.5px] text-muted">
            Favourite shot: <span className="text-ink">{favouriteShot}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={
              tier === "Elite"
                ? { background: "#FBF6E7", color: "#8A6D12" }
                : { background: "#F3F4F6", color: "#4B5563" }
            }
          >
            {tier}
          </span>
          <ChevronRight size={18} className="text-[#C0C6CC]" />
        </div>
      </Card>
    </Link>
  );
}
