import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * PHASE 2B (0011) — STATIC contract for explicit table privileges.
 *
 * Proves the SQL ENCODES the intended model. Live behaviour is exercised by
 * supabase/tests/phase2b_rls_roles.test.sql (local harness, or a DEV Supabase
 * project with approval).
 */

const SUPABASE_DIR = resolve(__dirname, "../../../supabase");
const MIG_DIR = resolve(SUPABASE_DIR, "migrations");
const MIGRATIONS = readdirSync(MIG_DIR).filter((f) => f.endsWith(".sql")).sort();

/** Lower-cased executable SQL with comments removed and whitespace collapsed. */
function normalise(raw: string): string {
  return raw
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join("\n")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const read = (file: string) => readFileSync(resolve(MIG_DIR, file), "utf8");
const ALL_SQL = normalise(MIGRATIONS.map(read).join("\n"));
const SQL = normalise(read("0011_explicit_privileges_private_notes.sql"));
const TEST_RAW = readFileSync(resolve(SUPABASE_DIR, "tests/phase2b_rls_roles.test.sql"), "utf8");
const TEST_SQL = normalise(TEST_RAW);

const TABLES = [...ALL_SQL.matchAll(/create table (?:public\.)?([a-z_]+)/g)].map((m) => m[1]);

function revokeBlock(): string {
  const start = SQL.indexOf("revoke all on table");
  expect(start, "missing revoke block").toBeGreaterThanOrEqual(0);
  return SQL.slice(start, SQL.indexOf(";", start));
}

describe("0011 explicit table privileges (static)", () => {
  it("every table in every migration has RLS enabled", () => {
    expect(TABLES.length).toBeGreaterThanOrEqual(14);
    for (const t of TABLES) {
      expect(
        new RegExp(`alter table (public\\.)?${t} enable row level security`).test(ALL_SQL),
        `no RLS on ${t}`,
      ).toBe(true);
    }
  });

  it("every table has its direct privileges cleared for all three API roles", () => {
    const block = revokeBlock();
    for (const t of TABLES) expect(block, `not revoked: ${t}`).toContain(`public.${t}`);
    expect(block).toMatch(/from public, anon, authenticated, service_role$/);
  });

  it("anon receives no table privilege", () => {
    expect(SQL).not.toMatch(/grant (select|insert|update|delete|all|truncate)[^;]* on table [^;]* to [^;]*anon/);
  });

  it("authenticated receives SELECT only", () => {
    const grants = [...SQL.matchAll(/grant ([^;]*?) on table [^;]* to authenticated;/g)];
    expect(grants.length).toBeGreaterThan(0);
    for (const g of grants) expect(g[1]).toMatch(/^select\b/);
  });

  it("service_role receives exactly the provisioning allowlist", () => {
    const grants = [...SQL.matchAll(/grant ([a-z, ]+?) on table public\.([a-z_]+) to service_role;/g)]
      .map((g) => `${g[2]}: ${g[1].replace(/\s+/g, "")}`)
      .sort();
    expect(grants).toEqual([
      "app_users: select,insert",
      "audit_events: insert",
      "member_access: select,insert,update",
      "user_roles: select,insert,update",
    ]);
  });

  it("coach_notes and published_by are never granted", () => {
    const grant = SQL.match(/grant select \(([^)]*)\) on table public\.coach_reviews to authenticated;/);
    expect(grant, "coach_reviews must use a column-level grant").not.toBeNull();
    expect(grant![1]).toContain("feedback");
    expect(grant![1]).not.toContain("coach_notes");
    expect(grant![1]).not.toContain("published_by");
    expect(SQL).not.toMatch(/grant select on table [^;]*coach_reviews[^;]* to authenticated/);
  });

  it("removes every unsafe write policy", () => {
    for (const [p, t] of [
      ["submissions_member_insert", "submissions"],
      ["submissions_coach_update", "submissions"],
      ["coach_reviews_write", "coach_reviews"],
      ["review_annotations_rw", "review_annotations"],
    ]) {
      expect(SQL).toContain(`drop policy if exists ${p} on public.${t}`);
      expect(SQL).not.toContain(`create policy ${p}`);
    }
  });

  it("member reads of coach_reviews require publication and an active entitlement", () => {
    const start = SQL.indexOf("create policy coach_reviews_select");
    const policy = SQL.slice(start, SQL.indexOf(";", start));
    expect(policy).toContain("published_at is not null");
    expect(policy).toContain("public.current_entitled_member_id()");
  });

  it("private notes are staff-only, and the old column is constrained empty", () => {
    expect(SQL).toContain("alter table public.coach_review_private_notes enable row level security");
    const start = SQL.indexOf("create policy coach_review_private_notes_staff_select");
    const policy = SQL.slice(start, SQL.indexOf(";", start));
    expect(policy).toContain("for select");
    expect(policy).toContain("current_user_has_role('coach')");
    expect(policy).not.toContain("current_app_user_id");
    expect(SQL).toContain("check (coach_notes is null)");
  });

  it("copies and verifies notes BEFORE clearing them", () => {
    const copy = SQL.indexOf("insert into public.coach_review_private_notes");
    const verify = SQL.indexOf("a coach note was not copied exactly");
    const clear = SQL.indexOf("update public.coach_reviews set coach_notes = null");
    expect(copy).toBeGreaterThanOrEqual(0);
    expect(verify).toBeGreaterThan(copy);
    expect(clear).toBeGreaterThan(verify);
  });

  it("never drops data or disables RLS, and never uses FORCE on entitlement_plans", () => {
    expect(SQL).not.toMatch(/drop table|drop column|truncate table|delete from/);
    expect(SQL).not.toMatch(/disable row level security|force row level security/);
    expect(SQL).toContain("alter table public.entitlement_plans enable row level security");
  });
});

describe("phase2b_rls_roles.test.sql safety (static)", () => {
  it("is one transaction that always rolls back", () => {
    expect(TEST_SQL.trim().startsWith("begin;")).toBe(true);
    expect(TEST_SQL.match(/\bbegin;/g)).toHaveLength(1);
    expect(TEST_SQL.match(/\brollback;/g)).toHaveLength(1);
    expect(TEST_SQL).not.toMatch(/\bcommit\b(?! drop)/);
  });

  it("uses only fictional identities", () => {
    const emails = [...TEST_RAW.matchAll(/'([^' ]+@[^' ]+)'/g)].map((m) => m[1]);
    expect(emails.length).toBeGreaterThan(0);
    for (const e of emails) expect(e).toMatch(/^rls-[a-z-]*@example\.test$|^rls-%@example\.test$/);
  });

  it("reports the pass result after the rollback", () => {
    expect(TEST_SQL.indexOf("all phase 2b assertions passed")).toBeGreaterThan(
      TEST_SQL.indexOf("rollback;"),
    );
  });

  it("classifies denials by layer", () => {
    for (const layer of ["table_privilege", "function_privilege", "rls_with_check"]) {
      expect(TEST_SQL).toContain(`'${layer}'`);
    }
  });
});
