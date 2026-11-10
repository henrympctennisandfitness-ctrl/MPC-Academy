-- 0007_phase2b_auth_identity_entitlement.sql
-- PHASE 2B — Supabase Auth identity mapping + time-bounded Academy entitlement.
--
-- ADDITIVE ONLY. Does not edit any Phase 1 migration. This migration SUPERSEDES
-- the temporary Phase 1 identity mechanism: current_app_user_id() no longer reads
-- the app.current_member_id GUC (which a browser could attempt to influence) and
-- instead derives the internal identity from the VERIFIED Supabase JWT via
-- auth.uid(). The GUC is never consulted again.
--
-- Requires the Supabase `auth` schema (auth.users, auth.uid()), which is present
-- on every Supabase project and in local `supabase start`. These statements are
-- intended for a Supabase target, matching the Phase 1 foundation.

-- 1) Identity mapping: Supabase auth.users.id -> internal app_users.id.
--    auth.users.id is NEVER the business key. app_users.id remains the sole
--    ownership identity for submissions/reviews/videos/entitlements. The column
--    is nullable (staff/service rows may exist before an auth user is linked)
--    and unique (one auth user maps to at most one internal identity).
alter table app_users
  add column if not exists auth_user_id uuid unique
    references auth.users(id) on delete set null;
create index if not exists app_users_auth_user_id_idx on app_users(auth_user_id);

-- 2) Extend the Academy-access entitlement (member_access) ADDITIVELY.
--    Phase 1's is_active remains the master revocation switch. We add a validity
--    window, a source, and an admin note. "status" is DERIVED: active iff
--    is_active AND now() within [valid_from, valid_until). timestamptz stores an
--    absolute instant, so Europe/London wall-clock windows are represented by the
--    correct UTC instants at provisioning time (see docs/phase-2b-authentication.md).
alter table member_access add column if not exists source      text;
alter table member_access add column if not exists valid_from  timestamptz;
alter table member_access add column if not exists valid_until timestamptz;
alter table member_access add column if not exists note        text;

-- 3) Redefine the identity resolver to derive from the verified session JWT.
--    SECURITY DEFINER so the app_users lookup is not itself blocked by RLS; the
--    owner bypasses RLS (tables are not FORCE RLS), so there is no policy
--    recursion. Returns NULL when unauthenticated -> member policies deny.
create or replace function current_app_user_id() returns uuid
  language sql stable security definer set search_path = public
as $$
  select id from app_users where auth_user_id = auth.uid()
$$;

-- 4) Entitlement predicate. Fail-closed: any missing/expired/not-yet-valid or
--    revoked (is_active=false) entitlement yields false even with a valid session.
create or replace function current_member_is_entitled() returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from member_access ma
    where ma.app_user_id = current_app_user_id()
      and ma.is_active
      and (ma.valid_from  is null or ma.valid_from  <= now())
      and (ma.valid_until is null or ma.valid_until >  now())
  )
$$;

-- 5) Identity present ONLY when entitled (else NULL). Member-scoped DATA policies
--    use this so an inactive/expired member cannot read coaching data even with a
--    live session. Identity/role/deletion policies keep using current_app_user_id().
create or replace function current_entitled_member_id() returns uuid
  language sql stable security definer set search_path = public
as $$
  select case when current_member_is_entitled()
              then current_app_user_id() else null end
$$;

-- 6) One-round-trip access snapshot for middleware / server route guards.
--    Returns only booleans + the internal id (never PII).
create or replace function current_access_snapshot()
  returns table(app_user_id uuid, is_entitled boolean, is_coach boolean, is_admin boolean)
  language sql stable security definer set search_path = public
as $$
  select current_app_user_id(),
         current_member_is_entitled(),
         current_user_has_role('COACH'),
         current_user_has_role('ADMIN')
$$;

-- Allow the authenticated (and anonymous, for a clean fail-closed answer) roles to
-- call the snapshot over PostgREST RPC. The resolvers above are called only from
-- policies/this snapshot; they need no direct client grant.
grant execute on function current_access_snapshot() to authenticated, anon;

comment on column app_users.auth_user_id is
  'Supabase auth.users.id -> internal identity map. NOT the business key.';
comment on function current_app_user_id() is
  'Phase 2B: internal app_user id from the verified JWT (auth.uid()). GUC no longer used.';
