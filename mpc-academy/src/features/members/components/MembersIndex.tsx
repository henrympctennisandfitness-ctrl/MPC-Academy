import { MEMBERS } from "../data";
import { MemberCard } from "./MemberCard";

/**
 * Members directory. Server-rendered so profile links live in the HTML and are
 * trivial to reference from Squarespace. `basePath` lets the coach roster reuse
 * this with /coach/members links.
 */
export function MembersIndex({ basePath = "/members" }: { basePath?: string }) {
  return (
    <div>
      <header className="mb-5">
        <h1 className="text-[26px] font-bold tracking-tight">Members</h1>
        <p className="mt-1 text-[15px] text-muted">
          Browse the academy roster. Tap a member to view their profile.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {MEMBERS.map((m) => (
          <MemberCard
            key={m.slug}
            slug={m.slug}
            name={m.name}
            initials={m.initials}
            membershipId={m.membershipId}
            level={m.level}
            favouriteShot={m.favouriteShot}
            tier={m.tier}
            basePath={basePath}
          />
        ))}
      </div>
    </div>
  );
}
