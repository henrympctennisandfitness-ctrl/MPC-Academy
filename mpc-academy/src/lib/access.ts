/**
 * Access & roles — central config.
 * -----------------------------------------------------------------------------
 * A simple mock identity/role layer, ready to be replaced by real auth later.
 * There is NO real authentication here: `CURRENT_USER_ID` just names the
 * "logged-in" user. When auth lands, resolve the current user from the session
 * and enforce access server-side (middleware) — the helpers below can stay.
 */

export type Role = "member" | "coach" | "admin";

export interface AppUser {
  id: string;
  name: string;
  role: Role;
}

/** Known users. Henry Macdonald and Calum Meston are admins. */
export const USERS: AppUser[] = [
  { id: "henry-macdonald", name: "Henry Macdonald", role: "admin" },
  { id: "calum-meston", name: "Calum Meston", role: "admin" },
  { id: "priya-sharma", name: "Priya Sharma", role: "member" },
  { id: "marcus-delaney", name: "Marcus Delaney", role: "member" },
  { id: "elena-kovac", name: "Elena Kovač", role: "member" },
  { id: "tom-rutherford", name: "Tom Rutherford", role: "member" },
  { id: "aisha-bello", name: "Aisha Bello", role: "member" },
];

/**
 * The mock "logged-in" user. Change this id to preview the app as someone else
 * — e.g. set it to "priya-sharma" to see the member experience (and the Coach
 * Studio access-denied screen). Replace with a real session lookup later.
 */
export const CURRENT_USER_ID = "henry-macdonald";

/** Resolve the current user (falls back to the first user if the id is stale). */
export function getCurrentUser(): AppUser {
  return USERS.find((u) => u.id === CURRENT_USER_ID) ?? USERS[0];
}

/** Coach Studio is open to coaches and admins. */
export function canAccessCoach(user: AppUser = getCurrentUser()): boolean {
  return user.role === "coach" || user.role === "admin";
}

/** Convenience: can the current user access Coach Studio? */
export function hasCoachAccess(): boolean {
  return canAccessCoach(getCurrentUser());
}
