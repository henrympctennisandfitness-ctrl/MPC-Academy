-- 0010_fix_role_rls_recursion.sql
-- PHASE 2B — make role checks non-re-entrant under RLS. ADDITIVE.
-- Does NOT edit 0001–0009. Does NOT drop, replace or loosen any RLS policy.
--
-- PROBLEM
--   Every role-gated policy calls current_user_has_role(r). Until now that was a
--   SECURITY INVOKER SQL function delegating to has_role(uid, r), which reads
--   public.user_roles AS THE QUERYING ROLE — i.e. under RLS. user_roles' own
--   policy (user_roles_self, 0006) itself calls current_user_has_role('ADMIN').
--   So every role check re-enters the user_roles policy, which re-enters the role
--   check, and so on:
--
--     policy(X) -> current_user_has_role -> has_role -> SELECT user_roles
--               -> user_roles_self -> current_user_has_role -> has_role -> ...
--
--   On PostgreSQL 16 this currently terminates only because (a) has_role is always
--   called with the caller's own id, (b) the planner evaluates the leakproof
--   `app_user_id = ...` filter before the RLS qual, and (c) the first OR branch of
--   user_roles_self then short-circuits. Termination therefore depends on planner
--   ordering and OR evaluation order — neither of which PostgreSQL guarantees —
--   and every role check pays for a nested RLS evaluation. A small change (a new
--   policy, a different plan, a role check on another member's id) can turn this
--   into "infinite recursion" / "stack depth limit exceeded" errors that make every
--   protected query fail. This migration removes the re-entrancy by construction.
--
-- FIX
--   1. current_user_has_role(r) becomes SECURITY DEFINER with search_path = ''.
--      It runs as the table owner, so its lookup of user_roles does NOT evaluate
--      user_roles' RLS policy -> no re-entry, no recursion, deterministic.
--      It is safe to run with owner rights because it can only answer one
--      question — "does THE CALLER hold role r?" — with the caller derived from
--      the verified JWT via current_app_user_id() -> auth.uid(). It accepts no
--      user/member id argument, so it cannot be used to probe anyone else.
--   2. has_role(uid, r) is no longer used by any policy. Because it accepts an
--      ARBITRARY uid it is removed from the browser roles (anon, authenticated);
--      it remains SECURITY INVOKER and service_role-only for server code.
--   3. The identity/entitlement resolvers from 0007 are re-declared with
--      search_path = '' and fully-qualified bodies (same semantics) so no
--      SECURITY DEFINER function in the identity chain resolves names through a
--      mutable search_path.
--   4. Defence in depth for roles/entitlements: anon and authenticated lose every
--      write privilege on user_roles and member_access (they already had no RLS
--      write policy, so this changes no legitimate path; provisioning uses the
--      service role). SELECT stays, still filtered by the existing RLS policies.
--      TRUNCATE is included because RLS does not apply to TRUNCATE.
--
-- PRIVILEGES follow 0009: revoke from PUBLIC, grant explicitly.

-- ---------------------------------------------------------------------------
-- 1) Non-re-entrant role check for the CURRENT caller only.
-- ---------------------------------------------------------------------------
create or replace function public.current_user_has_role(r public.app_role)
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.app_user_id = public.current_app_user_id()
      and ur.role = r
  )
$$;

-- ---------------------------------------------------------------------------
-- 2) Identity chain re-declared with an empty search_path (same semantics as 0007).
-- ---------------------------------------------------------------------------
create or replace function public.current_app_user_id()
  returns uuid
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select au.id from public.app_users au where au.auth_user_id = auth.uid()
$$;

create or replace function public.current_member_is_entitled()
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select exists (
    select 1 from public.member_access ma
    where ma.app_user_id = public.current_app_user_id()
      and ma.is_active
      and (ma.valid_from  is null or ma.valid_from  <= pg_catalog.now())
      and (ma.valid_until is null or ma.valid_until >  pg_catalog.now())
  )
$$;

create or replace function public.current_entitled_member_id()
  returns uuid
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select case when public.current_member_is_entitled()
              then public.current_app_user_id() else null end
$$;

create or replace function public.current_access_snapshot()
  returns table(app_user_id uuid, is_entitled boolean, is_coach boolean, is_admin boolean)
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select public.current_app_user_id(),
         public.current_member_is_entitled(),
         public.current_user_has_role('COACH'::public.app_role),
         public.current_user_has_role('ADMIN'::public.app_role)
$$;

-- ---------------------------------------------------------------------------
-- 3) EXECUTE privileges (explicit, 0009 model). CREATE OR REPLACE keeps existing
--    grants; they are restated so this file is self-describing.
-- ---------------------------------------------------------------------------
revoke execute on function public.current_user_has_role(public.app_role) from public;
revoke execute on function public.current_app_user_id()                  from public;
revoke execute on function public.current_member_is_entitled()           from public;
revoke execute on function public.current_entitled_member_id()           from public;
revoke execute on function public.current_access_snapshot()              from public;

-- Policy helpers: must stay executable by every role RLS is evaluated as.
grant execute on function public.current_user_has_role(public.app_role) to anon, authenticated, service_role;
grant execute on function public.current_app_user_id()                  to anon, authenticated, service_role;
grant execute on function public.current_member_is_entitled()           to anon, authenticated, service_role;
grant execute on function public.current_entitled_member_id()           to anon, authenticated, service_role;
grant execute on function public.current_access_snapshot()              to anon, authenticated, service_role;

-- has_role(uid, r) takes an arbitrary member id: server-only from now on.
revoke execute on function public.has_role(uuid, public.app_role) from public;
revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated;
grant  execute on function public.has_role(uuid, public.app_role) to service_role;

-- ---------------------------------------------------------------------------
-- 4) Roles and Academy entitlements are never writable from the browser roles.
-- ---------------------------------------------------------------------------
revoke insert, update, delete, truncate, references, trigger
  on table public.user_roles    from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.member_access from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) Reviewer documentation (no privilege effect).
-- ---------------------------------------------------------------------------
comment on function public.current_user_has_role(public.app_role) is
  '0010: SECURITY DEFINER, search_path=''''. Answers only whether the CALLER '
  '(auth.uid() -> app_users) holds role r. Bypasses user_roles RLS so role checks '
  'never re-enter user_roles_self. Takes no member id, so it cannot probe others.';
comment on function public.has_role(uuid, public.app_role) is
  '0010: no longer used by policies; accepts an arbitrary uid so it is service_role-only.';
