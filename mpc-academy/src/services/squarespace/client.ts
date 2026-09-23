/**
 * SERVER-ONLY, DEV-ONLY HTTP client for the capability probe.
 *
 * This is the only file that would touch the network, and it fails closed:
 *   - throws in the browser,
 *   - throws in production,
 *   - throws without a credential.
 * It is never imported by the live app, by tests, or by any client bundle. Tests
 * exercise the PURE classifier in membershipProbe.ts with fixtures instead, so no
 * test makes a real request.
 *
 * The credential is read at call time and sent only in the Authorization header —
 * never logged, never returned, never placed in a URL.
 */
import { loadProbeConfig, isLiveProbeEnabled, SQUARESPACE_ENV } from "./config";
import type { SquarespaceOrder } from "./types";

function requireLive(): void {
  if (!isLiveProbeEnabled()) {
    throw new Error(
      "Squarespace live probe is disabled (server + non-production + credential required).",
    );
  }
}

/**
 * Retrieve orders for a customer via the Orders API, filtered by customerId.
 * Returns typed orders; the caller passes them to the pure classifier.
 */
export async function fetchOrdersForCustomer(
  customerId: string,
): Promise<SquarespaceOrder[]> {
  requireLive();
  const { apiBase, apiVersion } = loadProbeConfig();
  const token = process.env[SQUARESPACE_ENV.credential] as string;

  const url = `${apiBase}/${apiVersion}/commerce/orders`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "MPC-Academy-Phase2A-Probe/0.1 (dev)",
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    // Do not include response bodies that might contain personal data.
    throw new Error(`Squarespace Orders API request failed with status ${res.status}`);
  }
  const body = (await res.json()) as { result?: SquarespaceOrder[] };
  const orders = body.result ?? [];
  // Client-side filter by customerId (the API also supports a customerId filter;
  // kept simple here for the probe).
  return orders.filter((o) => o.customerId === customerId);
}
