/**
 * Pure helpers over Orders API data. No network, no side effects, and — by
 * construction — no personal data in anything returned (only ids, dates, and
 * enum states). These are unit-tested with fictional fixtures.
 */
import type { OrderLineItem, SquarespaceOrder } from "./types";

/** True if a line item references one of the configured membership product ids. */
export function lineItemMatchesMembership(
  item: OrderLineItem,
  membershipProductIds: readonly string[],
): boolean {
  if (membershipProductIds.length === 0) return false;
  const candidates = [item.productId, item.variantId, item.sku].filter(
    (v): v is string => Boolean(v),
  );
  return candidates.some((c) => membershipProductIds.includes(c));
}

/** Orders that contain at least one membership-matching line item. */
export function membershipOrders(
  orders: readonly SquarespaceOrder[],
  membershipProductIds: readonly string[],
): SquarespaceOrder[] {
  return orders.filter((o) =>
    (o.lineItems ?? []).some((li) => lineItemMatchesMembership(li, membershipProductIds)),
  );
}

/** Most recent order by createdOn (ISO). Returns null for an empty list. */
export function latestOrderDate(orders: readonly SquarespaceOrder[]): string | null {
  const dates = orders
    .map((o) => o.createdOn)
    .filter((d): d is string => Boolean(d))
    .sort();
  return dates.length ? dates[dates.length - 1] : null;
}
