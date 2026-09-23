/**
 * Typed shapes for the Squarespace Commerce API responses we inspect, plus the
 * probe's own result types.
 *
 * Field names below mirror the official Orders API documentation
 * (developers.squarespace.com/commerce-apis). Only the fields the probe reads are
 * typed; unknown fields are tolerated. The exact line-item identifier that maps a
 * membership order to a pricing plan MUST be confirmed against a live site (see
 * the doc's "Open questions"), so several identifier fields are optional.
 */

/** Order.fulfillmentStatus (official enum). */
export type OrderFulfillmentStatus = "PENDING" | "FULFILLED" | "CANCELED";

/** Order.paymentState (official enum, incl. Payment Plans). */
export type OrderPaymentState =
  | "NOT_CHARGED"
  | "AUTHORIZED"
  | "PAID"
  | "PARTIALLY_PAID"
  | "REFUNDED";

export interface OrderLineItem {
  id: string;
  /** Identifiers that MAY carry the pricing-plan/product reference (confirm live). */
  productId?: string | null;
  variantId?: string | null;
  sku?: string | null;
  productName?: string | null;
  quantity?: number;
}

/**
 * Subset of the Orders API Order resource. An Order is a historical financial
 * event — it does NOT carry a current subscription/membership status field.
 */
export interface SquarespaceOrder {
  id: string;
  /** Stable customer identifier; the Orders API can filter by this. */
  customerId?: string | null;
  /** Present but treated as PII — never emitted by the probe. */
  customerEmail?: string | null;
  createdOn?: string;
  modifiedOn?: string;
  fulfillmentStatus?: OrderFulfillmentStatus;
  paymentState?: OrderPaymentState;
  lineItems?: OrderLineItem[];
}

/** What a supported API CAN observe, in redacted/structural form only. */
export interface MembershipObservation {
  /** Stable external identity candidate for external_ref → internal UUID mapping. */
  customerId: "present" | "absent";
  /** Whether any order line item matched a configured membership product id. */
  hasMatchingMembershipOrder: boolean;
  /** ISO date of the most recent matching order, if any (a purchase event, not proof of active). */
  latestMatchingOrderDate: string | null;
  /** Fulfillment/payment states seen on matching orders (order state, NOT membership state). */
  matchingOrderFulfillment: OrderFulfillmentStatus[];
  matchingOrderPayment: OrderPaymentState[];
}

/**
 * The probe's verdict. `activeMembershipDeterminable` is the whole point of
 * Phase 2A: with the supported public APIs it is expected to be false, so the
 * access decision fails closed to DENY.
 */
export interface MembershipProbeResult {
  observation: MembershipObservation;
  activeMembershipDeterminable: boolean;
  /** Human-readable reason the determination could/couldn't be made. */
  reason: string;
  /** Fail-closed access decision. Never GRANT from historical orders alone. */
  accessDecision: "DENY" | "GRANT";
}
