import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * PHASE 2B (0009) security-contract tests.
 *
 * Two kinds, clearly separated:
 *   (1) STATIC verification of migration 0009's privilege model by parsing the
 *       SQL. This proves the migration ENCODES the contract; it does NOT claim to
 *       prove live RLS/EXECUTE behaviour.
 *   (2) INTEGRATION expectations (require a real Postgres/Supabase) — listed and
 *       SKIPPED here so they are visible but never faked with mocks.
 */

const SQL_0009 = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/0009_security_hardening.sql"),
  "utf8",
).toLowerCase();

/** Bucket-D mutation functions that must be service_role-only. */
const MUTATION_FNS = [
  "transition_submission(uuid, submission_status, app_role)",
  "ensure_entitlement(uuid, date, text)",
  "claim_entitlement(uuid, date, uuid)",
  "release_entitlement(uuid)",
  "grant_entitlement(uuid, date, integer, text, uuid)",
];

describe("0009 static privilege model", () => {
  it("revokes EXECUTE from PUBLIC on every privileged mutation function", () => {
    for (const fn of MUTATION_FNS) {
      const rx = new RegExp(
        `revoke execute on function public\\.${escapeRe(fn)}\\s+from public`,
      );
      expect(rx.test(SQL_0009), `missing PUBLIC revoke for ${fn}`).toBe(true);
    }
  });

  it("revokes EXECUTE from anon and authenticated on mutation functions", () => {
    for (const fn of MUTATION_FNS) {
      const rx = new RegExp(
        `revoke execute on function public\\.${escapeRe(fn)}\\s+from anon, authenticated`,
      );
      expect(rx.test(SQL_0009), `missing anon/authenticated revoke for ${fn}`).toBe(true);
    }
  });

  it("grants mutation functions to service_role ONLY (never anon/authenticated)", () => {
    for (const fn of MUTATION_FNS) {
      const grant = new RegExp(
        `grant execute on function public\\.${escapeRe(fn)}\\s+to service_role`,
      );
      expect(grant.test(SQL_0009), `missing service_role grant for ${fn}`).toBe(true);
      // must NOT grant these to anon/authenticated anywhere
      const bad = new RegExp(
        `grant execute on function public\\.${escapeRe(fn)}\\s+to[^;]*authenticated`,
      );
      expect(bad.test(SQL_0009), `mutation fn granted to authenticated: ${fn}`).toBe(false);
    }
  });

  it("keeps current_access_snapshot() callable by anon and authenticated", () => {
    expect(
      /grant execute on function public\.current_access_snapshot\(\)\s+to anon, authenticated/.test(
        SQL_0009,
      ),
    ).toBe(true);
  });

  it("keeps policy helpers callable by authenticated (RLS would break otherwise)", () => {
    for (const fn of [
      "current_app_user_id()",
      "current_member_is_entitled()",
      "current_entitled_member_id()",
      "current_user_has_role(app_role)",
      "has_role(uuid, app_role)",
    ]) {
      const rx = new RegExp(
        `grant execute on function public\\.${escapeRe(fn)}\\s+to anon, authenticated`,
      );
      expect(rx.test(SQL_0009), `policy helper not granted to authenticated: ${fn}`).toBe(true);
    }
  });

  it("sets secure default privileges (future functions not PUBLIC-executable)", () => {
    expect(
      /alter default privileges in schema public revoke execute on functions from public/.test(
        SQL_0009,
      ),
    ).toBe(true);
  });

  it("does not edit earlier migrations (only 0009 carries the hardening)", () => {
    // Guard: 0009 must be a self-contained REVOKE/GRANT migration, not a rewrite
    // of tables/policies.
    expect(SQL_0009).not.toMatch(/create table/);
    expect(SQL_0009).not.toMatch(/drop policy/);
  });
});

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * INTEGRATION EXPECTATIONS — require a live Postgres/Supabase with the anon,
 * authenticated and service_role roles and 0001–0009 applied. Skipped here; do
 * NOT mock these (a mocked "pass" would not prove RLS/privilege enforcement).
 * Run against `supabase start` with fictional users.
 */
describe.skip("0009 integration (requires live Supabase)", () => {
  it("anon cannot execute grant_entitlement / claim_entitlement / release_entitlement / ensure_entitlement / transition_submission", () => {});
  it("authenticated MEMBER cannot execute any bucket-D mutation function", () => {});
  it("MEMBER cannot impersonate COACH/ADMIN via transition_submission (function not executable at all)", () => {});
  it("MEMBER cannot grant themselves entitlement", () => {});
  it("MEMBER cannot alter another member's entitlement/allowance", () => {});
  it("MEMBER cannot INSERT/UPDATE user_roles (no policy -> denied)", () => {});
  it("MEMBER cannot write member_access (no policy -> denied)", () => {});
  it("expired/revoked member cannot SELECT submissions/videos/reviews", () => {});
  it("COACH can read coaching data per role policies only", () => {});
  it("ADMIN retains intended administrative access", () => {});
  it("current_access_snapshot is callable and fail-closed for anon and unmapped users", () => {});
});
