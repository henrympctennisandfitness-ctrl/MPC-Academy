/**
 * Squarespace capability probe (Phase 2A) — barrel.
 *
 * CLIENT-SAFE exports only: pure classifier, order helpers, config accessors,
 * and types. The network client (client.ts) and the live runner are server-only
 * and dev-only; import them directly from their files, never via this barrel.
 */
export {
  classifyMembership,
} from "./membershipProbe";
export {
  lineItemMatchesMembership,
  membershipOrders,
  latestOrderDate,
} from "./orders";
export {
  loadProbeConfig,
  isLiveProbeEnabled,
  SQUARESPACE_ENV,
  type SquarespaceProbeConfig,
} from "./config";
export type {
  OrderFulfillmentStatus,
  OrderPaymentState,
  OrderLineItem,
  SquarespaceOrder,
  MembershipObservation,
  MembershipProbeResult,
} from "./types";
