import { defineConfig } from "vitest/config";

/**
 * Phase 1 tests are pure unit tests (no DB, no network). RLS and the Supabase
 * repositories require a live database and are verified separately against a
 * real Supabase project — they are not run here (documented in docs/DATABASE.md).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: false,
  },
});
