/**
 * Access & roles — MOCK user system.
 * ---------------------------------------------------------------------------
 * There is NO real authentication yet. `CURRENT_USER_ID` names the "logged-in"
 * user so we can build and preview the app. Henry Macdonald and Calum Meston
 * are the only accounts with Coach Studio access; everyone else is an
 * "Academy Member".
 *
 * AUTH (future) — reintroducing real auth is localised:
 *   1. Add an auth SDK/provider and its env keys.
 *   2. Wrap the app in that provider in src/app/layout.tsx.
 *   3. Add middleware (src/middleware.ts) to protect routes.
 *   4. Replace getCurrentUser() below with the real session user, and derive
 *      the role from the user's email — or from Squarespace / a Google Sheet
 *      keyed by email.
 *   5. Add sign-in / sign-up pages.
 * The rest of the app only calls getCurrentUser() / canAccessCoach(), so
 * swapping the source touches nothing else.
 */

export type Role = "member" | "coach" | "admin";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Full label shown in the UI. */
  roleLabel: string;
}

/**
 * Coaches in the system. Henry Macdonald and Calum Meston are the ONLY coaches;
 * both are Head Coaches. Everyone else is an Academy Member (there is no member
 * roster here — academy members are listed only in the Coach Studio, from
 * Google Sheets). `MEMBER` is the generic fallback identity for the member
 * portal experience (the signed-in member's own data lives in CURRENT_MEMBER).
 */
export const USERS: MockUser[] = [
  { id: "henry-macdonald", name: "Henry Macdonald", email: "henrymacdonald35@gmail.com", role: "admin", roleLabel: "Head Coach" },
  { id: "calum-meston", name: "Calum Meston", email: "calum.meston@mpcacademy.com", role: "coach", roleLabel: "Head Coach" },
  { id: "member", name: "Academy Member", email: "member@mpcacademy.com", role: "member", roleLabel: "Academy Member" },
];

/**
 * The mock "logged-in" user. Change this id to preview the app as someone else
 * — e.g. "member" to see the Academy Member experience (no Coach Studio link,
 * and Access Denied at /coach). Replace with a real session later.
 */
export const CURRENT_USER_ID = "henry-macdonald";

/** Resolve the current mock user (falls back to the first user if id is stale). */
export function getCurrentUser(): MockUser {
  return USERS.find((u) => u.id === CURRENT_USER_ID) ?? USERS[0];
}

/** Coach Studio is open to coaches and admins only. */
export function canAccessCoach(user: MockUser = getCurrentUser()): boolean {
  return user.role === "coach" || user.role === "admin";
}

/** Short role title for the dev indicator. Coaches show as "Head Coach". */
export function roleTitle(role: Role): string {
  if (role === "admin" || role === "coach") return "Head Coach";
  return "Academy Member";
}
