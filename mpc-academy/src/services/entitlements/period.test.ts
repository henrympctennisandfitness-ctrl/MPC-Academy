import { describe, it, expect } from "vitest";
import { periodForDate, currentPeriod, APP_TIMEZONE } from "./period";

describe("entitlement period (Europe/London)", () => {
  it("maps a mid-month instant to that month", () => {
    expect(periodForDate(new Date("2026-09-15T12:00:00Z"))).toBe("2026-09-01");
  });

  it("respects British Summer Time at a month boundary", () => {
    // 30 Jun 2026 23:30 UTC = 01 Jul 2026 00:30 BST (UTC+1) -> July period.
    expect(periodForDate(new Date("2026-06-30T23:30:00Z"))).toBe("2026-07-01");
    // 30 Jun 2026 22:30 UTC = 30 Jun 2026 23:30 BST -> still June.
    expect(periodForDate(new Date("2026-06-30T22:30:00Z"))).toBe("2026-06-01");
  });

  it("respects GMT (winter) at a month boundary", () => {
    // 31 Jan 2026 23:30 UTC = 31 Jan 2026 23:30 GMT -> January.
    expect(periodForDate(new Date("2026-01-31T23:30:00Z"))).toBe("2026-01-01");
    // 31 Jan 2026 23:30 in London is still Jan; 1 Feb 00:30 UTC crosses to Feb.
    expect(periodForDate(new Date("2026-02-01T00:30:00Z"))).toBe("2026-02-01");
  });

  it("currentPeriod uses the app timezone and YYYY-MM-01 shape", () => {
    expect(APP_TIMEZONE).toBe("Europe/London");
    expect(currentPeriod(new Date("2026-09-15T12:00:00Z"))).toMatch(/^\d{4}-\d{2}-01$/);
  });
});
