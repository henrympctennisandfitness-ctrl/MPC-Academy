/**
 * Database seam barrel.
 *
 * NOTE: `supabaseClient` is intentionally NOT re-exported here to keep this
 * barrel client-safe. Import the client factories directly from
 * "./supabaseClient" in server-only code so the service-role path never gets
 * pulled into a client bundle by accident.
 */
export {
  getSupabaseUrl,
  getSupabaseAnonKey,
  getServiceRoleKey,
  hasSupabasePublicConfig,
} from "./env";
export {
  DEV_USER_IDS,
  DEV_ROLES,
  DEV_SUBMISSIONS,
} from "./devFixtures";
