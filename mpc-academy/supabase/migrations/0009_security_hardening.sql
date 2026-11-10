-- 0009_security_hardening.sql
-- PHASE 2B — function-privilege hardening. ADDITIVE. Does NOT edit 0001–0008.
--
-- WHY THIS EXISTS
-- In PostgreSQL, CREATE FUNCTION grants EXECUTE to PUBLIC by default. In Supabase,
-- the PostgREST roles `anon` and `authenticated` inherit that PUBLIC grant, so
-- EVERY function in an exposed schema (public) is callable over /rest/v1/rpc/<name>
-- by any browser client — INCLUDING SECURITY DEFINER functions, which run as the
-- owner and BYPASS RLS. RLS on tables does NOT protect function execution. Left
-- unhardened, a normal browser user could invoke grant_entitlement(),
-- claim_entitlement(), release_entitlement(), ensure_entitlement() or
-- transition_submission() directly and escalate privilege / mutate other members'
-- data. This migration removes that exposure with least privilege.
--
-- SUPABASE DEPENDENCY: the roles `anon`, `authenticated`, `service_role` and the
-- `auth` schema are provided by Supabase (already relied upon by 0007). These
-- statements target a Supabase database.
--
-- FUNCTION CLASSIFICATION (all in schema public), and the privilege each gets:
--   A. PUBLIC/BROWSER RPC (anon + authenticated may call):
--        current_access_snapshot()                      -> read-only, fail-closed
--   C. INTERNAL POLICY HELPERS (must stay callable so RLS can evaluate; each
--      returns only the caller's own scope or respects RLS):
--        current_app_user_id()          current_member_is_entitled()
--        current_entitled_member_id()   current_user_has_role(app_role)
--        has_role(uuid, app_role)
--   D. SERVER / SERVICE-ROLE-ONLY MUTATIONS (never callable by anon/authenticated):
--        transition_submission(uuid, submission_status, app_role)
--        ensure_entitlement(uuid, date, text)
--        claim_entitlement(uuid, date, uuid)
--        release_entitlement(uuid)
--        grant_entitlement(uuid, date, integer, text, uuid)
--   (trigger helper, not directly callable, no grant needed):
--        set_updated_at()
--   NOTE: there is no separate "B. authenticated member RPC" bucket in Phase 2B —
--   member-facing quota consumption / submission transitions are deferred to
--   Phase 3, so their functions stay in bucket D (server-only) for now.
--
-- APPROACH: make the grant model fully EXPLICIT. Revoke EXECUTE from PUBLIC on
-- every application function, then grant precisely to the roles that need it.
-- Relying on the inherited PUBLIC grant is exactly the footgun we are closing.

-- ---------------------------------------------------------------------------
-- 1) Reset: remove the implicit PUBLIC grant from every application function.
-- ---------------------------------------------------------------------------
revoke execute on function public.set_updated_at()                                        from public;
revoke execute on function public.current_app_user_id()                                   from public;
revoke execute on function public.has_role(uuid, app_role)                                from public;
revoke execute on function public.current_user_has_role(app_role)                         from public;
revoke execute on function public.current_member_is_entitled()                            from public;
revoke execute on function public.current_entitled_member_id()                            from public;
revoke execute on function public.current_access_snapshot()                               from public;
revoke execute on function public.transition_submission(uuid, submission_status, app_role) from public;
revoke execute on function public.ensure_entitlement(uuid, date, text)                    from public;
revoke execute on function public.claim_entitlement(uuid, date, uuid)                     from public;
revoke execute on function public.release_entitlement(uuid)                               from public;
revoke execute on function public.grant_entitlement(uuid, date, integer, text, uuid)      from public;

-- Be explicit for the privileged/mutation set: also revoke any DIRECT grants that
-- anon/authenticated might hold now or acquire later (defence in depth). Revoking
-- a privilege a role does not hold is a harmless no-op (NOTICE only).
revoke execute on function public.transition_submission(uuid, submission_status, app_role) from anon, authenticated;
revoke execute on function public.ensure_entitlement(uuid, date, text)                    from anon, authenticated;
revoke execute on function public.claim_entitlement(uuid, date, uuid)                     from anon, authenticated;
revoke execute on function public.release_entitlement(uuid)                               from anon, authenticated;
revoke execute on function public.grant_entitlement(uuid, date, integer, text, uuid)      from anon, authenticated;
-- Trigger helper: not callable as an ordinary function; keep it off anon/authenticated too.
revoke execute on function public.set_updated_at() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Bucket C — policy helpers. RLS policies (0006/0008) call these while being
--    evaluated AS the querying role, so anon + authenticated MUST retain EXECUTE
--    or every protected query would error with "permission denied for function"
--    instead of failing closed to an empty/deny result. These are safe to expose:
--      * current_* return only the caller's own id/booleans (derived from auth.uid());
--      * has_role() is SECURITY INVOKER and its body reads user_roles under RLS,
--        so probing another member's uuid returns false (no disclosure).
-- ---------------------------------------------------------------------------
grant execute on function public.current_app_user_id()            to anon, authenticated, service_role;
grant execute on function public.has_role(uuid, app_role)         to anon, authenticated, service_role;
grant execute on function public.current_user_has_role(app_role)  to anon, authenticated, service_role;
grant execute on function public.current_member_is_entitled()     to anon, authenticated, service_role;
grant execute on function public.current_entitled_member_id()     to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3) Bucket A — the intentional read-only browser RPC used by middleware/guards.
--    Fail-closed by construction: unauthenticated or unmapped -> current_app_user_id()
--    is NULL -> is_entitled/is_coach/is_admin all false; exposes no PII.
-- ---------------------------------------------------------------------------
grant execute on function public.current_access_snapshot() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4) Bucket D — privileged mutations. SERVER/SERVICE-ROLE ONLY in Phase 2B.
--    Granting ONLY service_role means a browser (anon/authenticated) cannot call
--    them at all, which fully closes the transition_submission p_actor-impersonation
--    vector: no member/coach can reach the function to pass p_actor='COACH'/'ADMIN'.
--    The owner (migration role) retains execute implicitly.
-- ---------------------------------------------------------------------------
grant execute on function public.transition_submission(uuid, submission_status, app_role) to service_role;
grant execute on function public.ensure_entitlement(uuid, date, text)                    to service_role;
grant execute on function public.claim_entitlement(uuid, date, uuid)                     to service_role;
grant execute on function public.release_entitlement(uuid)                               to service_role;
grant execute on function public.grant_entitlement(uuid, date, integer, text, uuid)      to service_role;

-- ---------------------------------------------------------------------------
-- 5) Default privileges: stop FUTURE functions created by the migration role in
--    schema public from being executable by PUBLIC by default. New app functions
--    must then GRANT EXECUTE explicitly (secure by default). This affects only
--    functions created AFTER this migration by the current role, so it does not
--    retroactively change 0001–0008 (handled explicitly above) and does not touch
--    Supabase-managed functions owned by other roles or in other schemas.
-- ---------------------------------------------------------------------------
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public
  revoke execute on functions from anon, authenticated;
-- ---------------------------------------------------------------------------
-- 6) Documentation for reviewers (no privilege effect).
-- ---------------------------------------------------------------------------
comment on function public.transition_submission(uuid, submission_status, app_role) is
  'SERVER-ONLY (service_role) as of 0009. Trusts p_actor, so it must never be reachable '
  'by anon/authenticated. Phase 3 will add an authenticated wrapper that DERIVES the actor '
  'from auth.uid()->user_roles and calls this with service authority (never passing a '
  'client-supplied actor).';
comment on function public.grant_entitlement(uuid, date, integer, text, uuid) is
  'SERVER-ONLY (service_role) as of 0009. Members must never grant themselves analyses.';
comment on function public.current_access_snapshot() is
  'Bucket A read-only RPC for middleware/guards. anon+authenticated; fail-closed; no PII.';
