import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * PHASE 2B (0010) — STATIC contract for the role-check recursion fix.
 *
 * Proves the migration ENCODES the intended privilege model. Live behaviour for
 * anonymous users, members, expired members, coaches and admins is exercised by
 * supabase/tests/phase2b_rls_roles.test.sql (run via supabase/tests/local/run-local.sh
 * on a throwaway PostgreSQL, or on a DEV Supabase project with approval).
 */

const MIG_DIR = resolve(__dirname, "../../../supabase/migrations");
const RAW = readFileSync(resolve(MIG_DIR, "0010_fix_role_rls_recursion.sql"), "utf8");
// Strip line comments so assertions only see executable SQL.
const SQL = RAW.split("\n")
  .map((l) => l.replace(/--.*$/, ""))
  .join("\n")
  .toLowerCase()
  .replace(/\s+/g, " ");

function fnBlock(name: string): string {
  const start = SQL.indexOf(`create or replace function public.${name}(`);
  expect(start, `missing definition of ${name}`).toBeGreaterThanOrEqual(0);
  const end = SQL.indexOf("$$;", SQL.indexOf("$$", start) + 2);
  return SQL.slice(start, end);
}

const DEFINER_FNS = [
  "current_user_has_role",
  "current_app_user_id",
  "current_member_is_entitled",
  "current_entitled_member_id",
  "current_access_snapshot",
];

describe("0010 role-check recursion fix (static)", () => {
  it("migrations are numbered 0001–0011 with no gaps", () => {
    const files = readdirSync(MIG_DIR).filter((f) => f.endsWith(".sql")).sort();
    expect(files.map((f) => f.slice(0, 4))).toEqual(
      ["0001", "0002", "0003", "0004", "0005", "0006", "0007", "0008", "0009", "0010", "0011"],
    );
  });

  it("current_user_has_role is SECURITY DEFINER with an empty search_path", () => {
    const b = fnBlock("current_user_has_role");
    expect(b).toContain("security definer");
    expect(b).toContain("set search_path = ''");
  });

  it("current_user_has_role derives the caller from the verified identity and takes no member id", () => {
    const b = fnBlock("current_user_has_role");
    expect(b).toMatch(/current_user_has_role\(r public\.app_role\)/);
    expect(b).not.toMatch(/\(\s*uid\b/);
    expect(b).toContain("ur.app_user_id = public.current_app_user_id()");
    expect(b).not.toMatch(/(^|[^a-z_])has_role\(/); // no delegation to has_role(uid, r)
  });

  it("every identity-chain SECURITY DEFINER function pins search_path to ''", () => {
    for (const fn of DEFINER_FNS) {
      const b = fnBlock(fn);
      expect(b, fn).toContain("security definer");
      expect(b, fn).toContain("set search_path = ''");
    }
  });

  it("current_app_user_id still resolves from auth.uid()", () => {
    expect(fnBlock("current_app_user_id")).toContain("auth.uid()");
  });

  it("follows the 0009 model: revoke from PUBLIC, grant explicitly", () => {
    for (const fn of DEFINER_FNS) {
      expect(SQL).toMatch(new RegExp(`revoke execute on function public\\.${fn}\\([^)]*\\) from public;`));
      expect(SQL).toMatch(
        new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to anon, authenticated, service_role;`),
      );
    }
  });

  it("has_role(uid, role) is removed from browser roles and kept for service_role", () => {
    expect(SQL).toContain("revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated;");
    expect(SQL).toContain("grant execute on function public.has_role(uuid, public.app_role) to service_role;");
    expect(SQL).not.toMatch(/grant execute on function public\.has_role\([^)]*\) to [^;]*(anon|authenticated)/);
  });

  it("browser roles cannot write roles or entitlements (incl. TRUNCATE, which bypasses RLS)", () => {
    for (const t of ["user_roles", "member_access"]) {
      expect(SQL).toContain(
        `revoke insert, update, delete, truncate, references, trigger on table public.${t} from anon, authenticated;`,
      );
    }
  });

  it("does not weaken RLS: no dropped/altered policies, no RLS disable, no new grants of write", () => {
    expect(SQL).not.toMatch(/drop policy|alter policy|create policy/);
    expect(SQL).not.toMatch(/disable row level security|no force row level security/);
    expect(SQL).not.toMatch(/grant (insert|update|delete|all)/);
    expect(SQL).not.toMatch(/bypassrls/);
  });
});
