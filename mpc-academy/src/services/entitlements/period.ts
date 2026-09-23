/**
 * Calendar-month entitlement period keys.
 *
 * The authoritative timezone is Europe/London (decision E). We compute the
 * first-of-month key (YYYY-MM-01) for a given instant in that zone, so DST and
 * midnight boundaries land in the correct calendar month. The DB stores whatever
 * key we pass, keeping month semantics owned by the application, consistently.
 */

export const APP_TIMEZONE = "Europe/London";

/** First-of-month period key (YYYY-MM-01) for `date`, in `timeZone`. */
export function periodForDate(date: Date, timeZone: string = APP_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  if (!year || !month) {
    throw new Error("Failed to compute entitlement period");
  }
  return `${year}-${month}-01`;
}

/** Current period key (defaults to now). */
export function currentPeriod(now: Date = new Date()): string {
  return periodForDate(now);
}
