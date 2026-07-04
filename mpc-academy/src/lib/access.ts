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
 * Central mock roster. Only Henry (admin) and Calum (coach) get coach access;
 * everyone else is an Academy Member.
 */
export const USERS: MockUser[] = [
  { id: "henry-macdonald", name: "Henry Macdonald", email: "henry.macdonald@mpcacademy.com", role: "admin", roleLabel: "Admin / Head Coach" },
  { id: "calum-meston", name: "Calum Meston", email: "calum.meston@mpcacademy.com", role: "coach", roleLabel: "Coach / Head Coach" },
  { id: "priya-sharma", name: "Priya Sharma", email: "priya.sharma@example.com", role: "member", roleLabel: "Academy Member" },
  { id: "marcus-delaney", name: "Marcus Delaney", email: "marcus.d@example.com", role: "member", roleLabel: "Academy Member" },
  { id: "elena-kovac", name: "Elena Kovač", email: "elena.k@example.com", role: "member", roleLabel: "Academy Member" },
  { id: "tom-rutherford", name: "Tom Rutherford", email: "tom.r@example.com", role: "member", roleLabel: "Academy Member" },
  { id: "aisha-bello", name: "Aisha Bello", email: "aisha.b@example.com", role: "member", roleLabel: "Academy Member" },
];

/**
 * The mock "logged-in" user. Change this id to preview the app as someone else
 * — e.g. "priya-sharma" to see the Academy Member experience (no Coach Studio
 * link, and Access Denied at /coach). Replace with a real session later.
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

/** Short role title for the dev indicator, e.g. "Admin". */
export function roleTitle(role: Role): string {
  if (role === "admin") return "Admin";
  if (role === "coach") return "Coach";
  return "Academy Member";
}
