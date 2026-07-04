import { Card } from "@/components/ui";
import { Avatar } from "./Avatar";

/** A featured, private note from the coach — the private-club touch. */
export function CoachNote({ note }: { note: { coach: string; text: string } }) {
  return (
    <Card className="p-6" style={{ background: "linear-gradient(180deg,#fff,#fbfdfc)" }}>
      <p className="text-[16px] font-medium leading-relaxed text-ink">
        &ldquo;{note.text}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Avatar initials={note.coach.split(" ").map((w) => w[0]).join("")} />
        <div>
          <p className="text-[13.5px] font-semibold">{note.coach}</p>
          <p className="text-[12.5px] text-muted">Academy coach</p>
        </div>
      </div>
    </Card>
  );
}
