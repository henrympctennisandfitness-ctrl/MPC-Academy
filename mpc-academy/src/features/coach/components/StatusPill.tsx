import { STATUS_STYLE } from "../constants";
import { normalizeStatus } from "../data";
import type { SubmissionStatus } from "../data";

/** Small status chip: coloured dot + label, tuned per status. */
export function StatusPill({
  status,
}: {
  /** Accepts raw Sheet values too — anything unknown renders as "New". */
  status?: SubmissionStatus | string | null;
}) {
  const safe = normalizeStatus(status);
  const s = STATUS_STYLE[safe];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: s.dot }}
        aria-hidden
      />
      {safe}
    </span>
  );
}
