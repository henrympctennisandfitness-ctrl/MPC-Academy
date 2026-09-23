import { describe, it, expect } from "vitest";
import { InMemoryEntitlementLedger, remaining } from "./model";

const P = "2026-09-01";

describe("entitlement consumption (1/month)", () => {
  it("allows one claim then blocks a second submission", () => {
    const l = new InMemoryEntitlementLedger(1);
    expect(l.claim("sub-1", P)).toBe(true);
    expect(remaining(l.state(P))).toBe(0);
    expect(l.claim("sub-2", P)).toBe(false); // exhausted
  });

  it("is idempotent for duplicate requests of the same submission", () => {
    const l = new InMemoryEntitlementLedger(1);
    expect(l.claim("sub-1", P)).toBe(true);
    expect(l.claim("sub-1", P)).toBe(true); // duplicate browser request
    expect(l.state(P).used).toBe(1); // not double-consumed
  });

  it("restores allowance when a submission is released (fail/cancel/void)", () => {
    const l = new InMemoryEntitlementLedger(1);
    l.claim("sub-1", P);
    expect(l.release("sub-1")).toBe(true);
    expect(remaining(l.state(P))).toBe(1);
    // a different submission can now consume
    expect(l.claim("sub-2", P)).toBe(true);
  });

  it("release is idempotent and never goes negative", () => {
    const l = new InMemoryEntitlementLedger(1);
    l.claim("sub-1", P);
    expect(l.release("sub-1")).toBe(true);
    expect(l.release("sub-1")).toBe(false); // already released
    expect(l.state(P).used).toBe(0);
  });

  it("an abandoned upload does not permanently consume the month", () => {
    const l = new InMemoryEntitlementLedger(1);
    l.claim("abandoned", P); // upload starts...
    l.release("abandoned"); // ...then fails/cancels
    expect(l.claim("real-submission", P)).toBe(true);
  });
});

describe("bonus grants and higher plans", () => {
  it("a bonus grant allows an extra analysis", () => {
    const l = new InMemoryEntitlementLedger(1);
    expect(l.claim("sub-1", P)).toBe(true);
    expect(l.claim("sub-2", P)).toBe(false);
    l.grant(P, 1); // admin bonus
    expect(l.claim("sub-2", P)).toBe(true);
  });

  it("supports 2/month plans via allowance", () => {
    const l = new InMemoryEntitlementLedger(2);
    expect(l.claim("sub-1", P)).toBe(true);
    expect(l.claim("sub-2", P)).toBe(true);
    expect(l.claim("sub-3", P)).toBe(false);
  });
});
