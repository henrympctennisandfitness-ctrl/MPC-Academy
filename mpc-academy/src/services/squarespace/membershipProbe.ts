/**
 * Phase 2A membership capability probe — PURE classifier.
 *
 * Answers the Phase 2A question in code: given the data the SUPPORTED Squarespace
 * public APIs actually return (Orders), can we prove a customer CURRENTLY has an
 * active MPC Academy membership?
 *
 * Finding (see docs/phase-2a-squarespace-capability.md): NO / NOT YET PROVEN.
 * The Orders API exposes historical orders with fulfillment/payment state and a
 * stable customerId, but no current pricing-plan membership status, no
 * subscription id, no renewal date; and no webhook topic reports subscription
 * cancellation/expiry. So this classifier NEVER infers "active" from orders and
 * fails closed to DENY. A historical PAID order is explicitly NOT proof of active
 * membership.
 *
 * This module is pure (no network, no env, no PII emitted) and is the only probe
 * logic exported from the barrel. The dev-only live runner lives in ./liveProbe.
 */
import { latestOrderDate, membershipOrders } from "./orders";
import type {
  MembershipObservation,
  MembershipProbeResult,
  SquarespaceOrder,
} from "./types";

export const NOT_DETERMINABLE_REASON =
  "Supported Squarespace public APIs (Orders/Contacts/Transactions/Webhooks) expose " +
  "historical order and payment state and a stable customerId, but no current " +
  "pricing-plan membership status, subscription id, renewal date, or " +
  "cancellation/expiry event. Current active membership cannot be proven from " +
  "these APIs alone, so access fails closed.";

/**
 * PURE. Classify what supported-API order data can tell us. Emits only
 * structural/redacted facts — never an email or name. Always fails closed.
 */
export function classifyMembership(
  orders: readonly SquarespaceOrder[],
  membershipProductIds: readonly string[],
): MembershipProbeResult {
  const matching = membershipOrders(orders, membershipProductIds);

  const observation: MembershipObservation = {
    customerId: orders.some((o) => Boolean(o.customerId)) ? "present" : "absent",
    hasMatchingMembershipOrder: matching.length > 0,
    latestMatchingOrderDate: latestOrderDate(matching),
    matchingOrderFulfillment: Array.from(
      new Set(matching.map((o) => o.fulfillmentStatus).filter(Boolean)),
    ) as MembershipObservation["matchingOrderFulfillment"],
    matchingOrderPayment: Array.from(
      new Set(matching.map((o) => o.paymentState).filter(Boolean)),
    ) as MembershipObservation["matchingOrderPayment"],
  };

  return {
    observation,
    activeMembershipDeterminable: false,
    reason: NOT_DETERMINABLE_REASON,
    accessDecision: "DENY",
  };
}
