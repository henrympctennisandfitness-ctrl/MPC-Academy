/**
 * DEV-ONLY, SERVER-ONLY live runner. Imports the network client, so it is never
 * re-exported from the barrel and never imported by tests. Fetches a customer's
 * orders and returns the same fail-closed, redacted verdict as the pure
 * classifier. Returns null unless the live probe is explicitly enabled
 * (non-production, server, credential present). Never prints tokens or PII.
 */
import { loadProbeConfig, isLiveProbeEnabled } from "./config";
import { fetchOrdersForCustomer } from "./client";
import { classifyMembership } from "./membershipProbe";
import type { MembershipProbeResult } from "./types";

export async function runLiveMembershipProbe(
  customerId: string,
): Promise<MembershipProbeResult | null> {
  if (!isLiveProbeEnabled()) return null;
  const config = loadProbeConfig();
  const orders = await fetchOrdersForCustomer(customerId);
  return classifyMembership(orders, config.membershipProductIds);
}
