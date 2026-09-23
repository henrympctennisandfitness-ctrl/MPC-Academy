/**
 * Environment accessors for the Supabase seam.
 *
 * SECURITY BOUNDARY (decision D & H):
 *   - The URL and the ANON key are public by design and may reach the browser.
 *     They are the only Supabase values allowed a NEXT_PUBLIC_ prefix.
 *   - The SERVICE ROLE key is a server-only secret. It must NEVER be exposed to
 *     the browser, so it is read from a non-public var and guarded against any
 *     access from a window context. If this module is ever imported into client
 *     code and the getter is called, it throws instead of leaking.
 *
 * Nothing here reads a value at module load; getters throw only when actually
 * called without configuration, so the app runs with no Supabase project set
 * (decision B — no live Supabase required to run locally).
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. See .env.example. ` +
        `Supabase is not required to run the app in Phase 1 (decision B); ` +
        `this is only thrown when a Supabase-backed path is explicitly used.`,
    );
  }
  return value;
}

/** PUBLIC. Safe in the browser. */
export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/** PUBLIC. Safe in the browser (RLS still governs every row). */
export function getSupabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * SERVER-ONLY secret. Throws if reached from a browser context. Read from a
 * NON-public variable name so bundlers never inline it into client code.
 */
export function getServiceRoleKey(): string {
  if (typeof window !== "undefined") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must never be accessed in the browser. " +
        "This is a server-only credential (decision D/H).",
    );
  }
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** True when the public Supabase config is present (used to pick a repository impl). */
export function hasSupabasePublicConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
