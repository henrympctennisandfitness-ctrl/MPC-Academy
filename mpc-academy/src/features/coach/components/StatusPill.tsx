import { STATUS_STYLE } from "../constants";
import type { SubmissionStatus } from "../data";

/** Small status chip: coloured dot + label, tuned per status. */
export function StatusPill({ status }: { status: SubmissionStatus }) {
  const s = STATUS_STYLE[status];
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
      {status}
    </span>
  );
}
