import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Supabase client factories.
 *
 * No client is created at module load (decision B): the app must run without a
 * live Supabase project. Factories build a client only when called, so importing
 * this file has no side effects and never forces configuration.
 *
 *   - createAnonClient(): RLS-scoped client using the public anon key. In Phase 2
 *     this is where the resolved member identity (app.current_member_id GUC) will
 *     be set per request so RLS can attribute rows. Until then RLS denies member
 *     rows by default (migration 0002/0006).
 *
 *   - createAdminClient(): service-role client that bypasses RLS. SERVER-ONLY —
 *     guarded against browser use. Intended for trusted server tasks
 *     (transitions driven by SYSTEM, entitlement grants, migrations), never for
 *     serving member requests directly.
 */

/** RLS-scoped anon client. Safe to build server-side; also usable in the browser. */
export function createAnonClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Service-role client. Bypasses RLS — SERVER ONLY. Throws in the browser.
 * Use for trusted, auditable server operations only.
 */
export function createAdminClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() must never run in the browser (service-role key).",
    );
  }
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
