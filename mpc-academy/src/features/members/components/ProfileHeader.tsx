import { Card } from "@/components/ui";
import { Avatar } from "./Avatar";
import type { Member } from "../data";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
        {label}
      </p>
      <p className="mt-0.5 truncate text-[14px] font-semibold">{value}</p>
    </div>
  );
}

/** Top-of-profile identity card: avatar, name, membership, and key facts. */
export function ProfileHeader({ member }: { member: Member }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <Avatar initials={member.initials} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-[24px] font-bold leading-tight tracking-tight">
            {member.name}
          </h1>
          <p className="mt-0.5 text-[13.5px] text-muted">{member.membershipId}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold-tint px-2.5 py-1 text-[12px] font-semibold text-[#8A6D12]">
            {member.role} · since {member.joined}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <StatTile label="Level" value={member.level} />
        <StatTile label="Hand" value={member.hand} />
        <StatTile label="Favourite shot" value={member.favouriteShot} />
      </div>
    </Card>
  );
}
