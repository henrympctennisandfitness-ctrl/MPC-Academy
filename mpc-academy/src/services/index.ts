/**
 * Services root barrel — CLIENT-SAFE surface only.
 *
 * This exposes the domain types, pure logic, and the SEED repository
 * implementations that the existing UI can adopt behind the repository seam
 * (decision B) without requiring a live Supabase project.
 *
 * Server-only modules are intentionally NOT re-exported here:
 *   - ./database/supabaseClient        (creates clients; service-role path)
 *   - ./submissions/supabase.repository (RLS-governed, server-only)
 *   - ./entitlements/supabase.repository
 * Import those directly from their files in server code.
 */
export * from "./identity";
export * from "./members";
export * from "./submissions";
export * from "./entitlements";
export * from "./reviews/types";
