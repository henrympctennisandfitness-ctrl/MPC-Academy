/**
 * Phase 2A — Squarespace capability probe: configuration.
 *
 * SERVER-ONLY. This module reads credentials/config from the environment and is
 * guarded so it can never run in a browser. Nothing here is wired into the live
 * app, RLS, or auth. It exists only to inspect what the supported Squarespace
 * public APIs can and cannot tell us about membership (see
 * docs/phase-2a-squarespace-capability.md).
 *
 * Secrets rules: no secret is hard-coded, logged, or committed. Only placeholder
 * variable NAMES are documented. All Squarespace credentials are server-only and
 * must never be prefixed NEXT_PUBLIC_.
 */

export interface SquarespaceProbeConfig {
  apiBase: string;
  apiVersion: string;
  /** Server-only Commerce API key OR OAuth bearer token. Never exposed to the browser. */
  hasCredential: boolean;
  /** Pricing-plan / product identifiers that represent MPC Academy membership. */
  membershipProductIds: string[];
}

/** Env var NAMES (placeholders only — see .env additions in the Phase 2A doc). */
export const SQUARESPACE_ENV = {
  apiBase: "SQUARESPACE_API_BASE",
  apiVersion: "SQUARESPACE_API_VERSION",
  credential: "SQUARESPACE_API_KEY", // server-only; OAuth token path uses SQUARESPACE_OAUTH_* (see doc)
  membershipProductIds: "SQUARESPACE_MEMBERSHIP_PRODUCT_IDS",
} as const;

function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "Squarespace probe is server-only and must never run in the browser.",
    );
  }
}

export function loadProbeConfig(): SquarespaceProbeConfig {
  assertServerOnly();
  const ids = (process.env[SQUARESPACE_ENV.membershipProductIds] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    apiBase: process.env[SQUARESPACE_ENV.apiBase] ?? "https://api.squarespace.com",
    apiVersion: process.env[SQUARESPACE_ENV.apiVersion] ?? "1.0",
    hasCredential: Boolean(process.env[SQUARESPACE_ENV.credential]),
    membershipProductIds: ids,
  };
}

/**
 * The live probe fails closed: it runs only server-side, only outside production,
 * and only when a credential is present. Otherwise it does nothing (no access,
 * no network).
 */
export function isLiveProbeEnabled(): boolean {
  if (typeof window !== "undefined") return false;
  if (process.env.NODE_ENV === "production") return false;
  return Boolean(process.env[SQUARESPACE_ENV.credential]);
}
