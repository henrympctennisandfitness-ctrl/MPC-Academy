import { describe, it, expect } from "vitest";
import { classifyMembership } from "./membershipProbe";
import type { SquarespaceOrder } from "./types";

/**
 * Fixtures use ENTIRELY FICTIONAL ids/data (Phase 2A rule: no real-member data).
 * Emails are present in inputs only to prove the probe never emits them.
 */
const MEMBERSHIP_IDS = ["prod_mpc_membership_fake"];

const historicalPaidMembershipOrder: SquarespaceOrder = {
  id: "order_fake_0001",
  customerId: "cust_fake_0001",
  customerEmail: "fake.person@example.invalid",
  createdOn: "2025-01-10T00:00:00Z",
  fulfillmentStatus: "FULFILLED",
  paymentState: "PAID",
  lineItems: [{ id: "li_fake_1", productId: "prod_mpc_membership_fake", quantity: 1 }],
};

const nonMemberOrder: SquarespaceOrder = {
  id: "order_fake_0002",
  customerId: "cust_fake_0002",
  createdOn: "2025-02-01T00:00:00Z",
  fulfillmentStatus: "FULFILLED",
  paymentState: "PAID",
  lineItems: [{ id: "li_fake_2", productId: "prod_other_fake", quantity: 1 }],
};

describe("classifyMembership (fail-closed capability probe)", () => {
  it("does NOT treat a historical PAID membership order as active membership", () => {
    const result = classifyMembership([historicalPaidMembershipOrder], MEMBERSHIP_IDS);
    expect(result.observation.hasMatchingMembershipOrder).toBe(true);
    expect(result.activeMembershipDeterminable).toBe(false);
    expect(result.accessDecision).toBe("DENY");
  });

  it("denies a non-member (no matching membership order)", () => {
    const result = classifyMembership([nonMemberOrder], MEMBERSHIP_IDS);
    expect(result.observation.hasMatchingMembershipOrder).toBe(false);
    expect(result.accessDecision).toBe("DENY");
  });

  it("denies when there are no orders at all", () => {
    const result = classifyMembership([], MEMBERSHIP_IDS);
    expect(result.observation.customerId).toBe("absent");
    expect(result.observation.hasMatchingMembershipOrder).toBe(false);
    expect(result.accessDecision).toBe("DENY");
  });

  it("surfaces customerId as a stable external-ref candidate (present/absent only)", () => {
    const present = classifyMembership([historicalPaidMembershipOrder], MEMBERSHIP_IDS);
    expect(present.observation.customerId).toBe("present");
  });

  it("never emits personal data (no email/name anywhere in the result)", () => {
    const result = classifyMembership([historicalPaidMembershipOrder], MEMBERSHIP_IDS);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("@");
    expect(serialized.toLowerCase()).not.toContain("example.invalid");
  });

  it("reports latest matching order date (a purchase event, not proof of active)", () => {
    const result = classifyMembership(
      [
        historicalPaidMembershipOrder,
        { ...historicalPaidMembershipOrder, id: "order_fake_0003", createdOn: "2025-06-01T00:00:00Z" },
      ],
      MEMBERSHIP_IDS,
    );
    expect(result.observation.latestMatchingOrderDate).toBe("2025-06-01T00:00:00Z");
    // Even with a more recent order, membership is still not determinable.
    expect(result.activeMembershipDeterminable).toBe(false);
  });
});
