-- supabase/tests/phase2b_rls_roles.test.sql
--
-- PHASE 2B — privilege / RLS / entitlement integration test (migrations 0001–0011).
--
-- ROLLBACK-ONLY: fictional fixtures are created in one transaction, each actor is
-- impersonated with `set local role` + JWT claims (the mechanism PostgREST uses),
-- and everything is rolled back. The first failed assertion raises and aborts.
--
-- WHERE IT MAY RUN
--   * the local harness (supabase/tests/local/run-local.sh) — plain PostgreSQL
--   * a DEVELOPMENT Supabase project, as `postgres`, ONLY with explicit approval
-- Never run against production. Run the WHOLE file with nothing highlighted: a
-- partial selection could leave out `begin;` and commit the fixtures.
-- With psql, always use -v ON_ERROR_STOP=1.
--
-- READING THE RESULT
--   The final row 'ALL PHASE 2B ASSERTIONS PASSED' can only appear if nothing
--   raised; leftover_fixtures must be 0. Failure prefixes say which layer failed:
--     GRANT-MISMATCH / COLUMN-GRANT / FUNCTION-GRANT  privilege catalog is wrong
--     RLS-DISABLED / POLICY-UNSAFE                    table or policy setup is wrong
--     UNEXPECTED-ALLOW                                a denied operation succeeded
--     WRONG-LAYER                                     denied, but by the wrong layer
--     RLS-RESULT                                      row policy returned wrong rows
--     BLOCKED-BEFORE-RLS                              table grant stopped the query
--     OPERATION-FAILED                                an allowed operation failed
--     SNAPSHOT / DATA-MOVE                            identity or notes check failed
--
-- Actors: anonymous, unmapped user, members A and B, expired E, revoked R,
--         not-yet-valid F, coach C, coach+admin D, service_role.

begin;

-- ---------------------------------------------------------------- fixtures --
insert into auth.users (id, email) values
  ('00000000-0000-4000-a000-00000000000a', 'rls-member-a@example.test'),
  ('00000000-0000-4000-a000-00000000000b', 'rls-member-b@example.test'),
  ('00000000-0000-4000-a000-00000000000c', 'rls-coach-c@example.test'),
  ('00000000-0000-4000-a000-00000000000d', 'rls-admin-d@example.test'),
  ('00000000-0000-4000-a000-00000000000e', 'rls-expired-e@example.test'),
  ('00000000-0000-4000-a000-0000000000a1', 'rls-revoked-r@example.test'),
  ('00000000-0000-4000-a000-0000000000f1', 'rls-future-f@example.test'),
  ('00000000-0000-4000-a000-0000000000b1', 'rls-provisioned@example.test'),
  ('00000000-0000-4000-a000-0000000000ff', 'rls-unmapped@example.test');

insert into public.app_users (id, auth_user_id) values
  ('10000000-0000-4000-a000-00000000000a', '00000000-0000-4000-a000-00000000000a'),
  ('10000000-0000-4000-a000-00000000000b', '00000000-0000-4000-a000-00000000000b'),
  ('10000000-0000-4000-a000-00000000000c', '00000000-0000-4000-a000-00000000000c'),
  ('10000000-0000-4000-a000-00000000000d', '00000000-0000-4000-a000-00000000000d'),
  ('10000000-0000-4000-a000-00000000000e', '00000000-0000-4000-a000-00000000000e'),
  ('10000000-0000-4000-a000-0000000000a1', '00000000-0000-4000-a000-0000000000a1'),
  ('10000000-0000-4000-a000-0000000000f1', '00000000-0000-4000-a000-0000000000f1');

insert into public.member_access (app_user_id, is_active, valid_from, valid_until) values
  ('10000000-0000-4000-a000-00000000000a', true,  now() - interval '1 day',   now() + interval '30 days'),
  ('10000000-0000-4000-a000-00000000000b', true,  null, null),
  ('10000000-0000-4000-a000-00000000000e', true,  now() - interval '60 days', now() - interval '1 day'),
  ('10000000-0000-4000-a000-0000000000a1', false, null, null),
  ('10000000-0000-4000-a000-0000000000f1', true,  now() + interval '1 day',   null);

insert into public.user_roles (app_user_id, role) values
  ('10000000-0000-4000-a000-00000000000a', 'MEMBER'),
  ('10000000-0000-4000-a000-00000000000b', 'MEMBER'),
  ('10000000-0000-4000-a000-00000000000e', 'MEMBER'),
  ('10000000-0000-4000-a000-0000000000a1', 'MEMBER'),
  ('10000000-0000-4000-a000-0000000000f1', 'MEMBER'),
  ('10000000-0000-4000-a000-00000000000c', 'COACH'),
  ('10000000-0000-4000-a000-00000000000d', 'COACH'),
  ('10000000-0000-4000-a000-00000000000d', 'ADMIN');

insert into public.submissions (id, member_id, status, analysis_type, goal) values
  ('20000000-0000-4000-a000-00000000000a', '10000000-0000-4000-a000-00000000000a', 'SUBMITTED', 'forehand', 'test'),
  ('20000000-0000-4000-a000-00000000000b', '10000000-0000-4000-a000-00000000000b', 'SUBMITTED', 'serve',    'test'),
  ('20000000-0000-4000-a000-0000000000b2', '10000000-0000-4000-a000-00000000000b', 'IN_REVIEW', 'return',   'test'),
  ('20000000-0000-4000-a000-00000000000e', '10000000-0000-4000-a000-00000000000e', 'SUBMITTED', 'volley',   'test'),
  ('20000000-0000-4000-a000-0000000000a1', '10000000-0000-4000-a000-0000000000a1', 'SUBMITTED', 'smash',    'test'),
  ('20000000-0000-4000-a000-0000000000f1', '10000000-0000-4000-a000-0000000000f1', 'SUBMITTED', 'lob',      'test');

insert into public.coach_reviews (id, submission_id, coach_id, feedback, published_at, published_by) values
  ('30000000-0000-4000-a000-00000000000a', '20000000-0000-4000-a000-00000000000a', '10000000-0000-4000-a000-00000000000c', 'published-for-a', now(), '10000000-0000-4000-a000-00000000000c'),
  ('30000000-0000-4000-a000-00000000000b', '20000000-0000-4000-a000-00000000000b', '10000000-0000-4000-a000-00000000000c', 'published-for-b', now(), '10000000-0000-4000-a000-00000000000c'),
  ('30000000-0000-4000-a000-0000000000b2', '20000000-0000-4000-a000-0000000000b2', '10000000-0000-4000-a000-00000000000c', 'draft-for-b',     null,  null),
  ('30000000-0000-4000-a000-00000000000e', '20000000-0000-4000-a000-00000000000e', '10000000-0000-4000-a000-00000000000c', 'published-for-e', now(), '10000000-0000-4000-a000-00000000000c'),
  ('30000000-0000-4000-a000-0000000000a1', '20000000-0000-4000-a000-0000000000a1', '10000000-0000-4000-a000-00000000000c', 'published-for-r', now(), '10000000-0000-4000-a000-00000000000c');

insert into public.coach_review_private_notes (review_id, body, author_id) values
  ('30000000-0000-4000-a000-00000000000a', 'private-about-a', '10000000-0000-4000-a000-00000000000c'),
  ('30000000-0000-4000-a000-00000000000b', 'private-about-b', '10000000-0000-4000-a000-00000000000c');

-- Keeps staff counts independent of any other rows in a development database.
create temp table fx(id uuid primary key) on commit drop;
insert into fx select id from public.app_users where id::text like '10000000-0000-4000-a000-%';
grant select on fx to authenticated;

-- ----------------------------------------------------------------- helpers --
-- A denial and an RLS rejection share SQLSTATE 42501, so the message is classified.
create function pg_temp.expect_denied(p_id text, p_layer text, p_sql text) returns void
language plpgsql as $f$
declare v_msg text; v_got text;
begin
  execute p_sql;
  raise exception 'UNEXPECTED-ALLOW %: %', p_id, p_sql;
exception when insufficient_privilege then
  get stacked diagnostics v_msg = message_text;
  v_got := case
    when v_msg like 'permission denied for table%'
      or v_msg like 'permission denied for column%' then 'TABLE_PRIVILEGE'
    when v_msg like 'permission denied for function%' then 'FUNCTION_PRIVILEGE'
    when v_msg like 'new row violates row-level security%' then 'RLS_WITH_CHECK'
    else 'OTHER' end;
  if v_got <> p_layer then
    raise exception 'WRONG-LAYER %: expected %, got % (%)', p_id, p_layer, v_got, v_msg;
  end if;
end $f$;

create function pg_temp.expect_count(p_id text, p_sql text, p_n bigint) returns void
language plpgsql as $f$
declare v bigint;
begin
  execute p_sql into v;
  if v is distinct from p_n then
    raise exception 'RLS-RESULT %: expected % rows, got %', p_id, p_n, v;
  end if;
exception when insufficient_privilege then
  raise exception 'BLOCKED-BEFORE-RLS %: %', p_id, sqlerrm;
end $f$;

create function pg_temp.expect_affected(p_id text, p_sql text, p_n bigint) returns void
language plpgsql as $f$
declare v bigint;
begin
  execute p_sql;
  get diagnostics v = row_count;
  if v <> p_n then
    raise exception 'RLS-RESULT %: expected % affected rows, got %', p_id, p_n, v;
  end if;
exception when insufficient_privilege then
  raise exception 'BLOCKED-BEFORE-RLS %: %', p_id, sqlerrm;
end $f$;

create function pg_temp.expect_ok(p_id text, p_sql text) returns void
language plpgsql as $f$
begin
  execute p_sql;
exception when others then
  raise exception 'OPERATION-FAILED %: % [%]', p_id, sqlerrm, sqlstate;
end $f$;

create function pg_temp.expect_snapshot(
  p_id text, p_user uuid, p_entitled boolean, p_coach boolean, p_admin boolean
) returns void
language plpgsql as $f$
declare s record;
begin
  select * into s from public.current_access_snapshot();
  if s.app_user_id is distinct from p_user
     or s.is_entitled is distinct from p_entitled
     or s.is_coach is distinct from p_coach
     or s.is_admin is distinct from p_admin then
    raise exception 'SNAPSHOT %: got %', p_id, s;
  end if;
end $f$;

grant execute on function pg_temp.expect_denied(text, text, text)            to anon, authenticated, service_role;
grant execute on function pg_temp.expect_count(text, text, bigint)           to anon, authenticated, service_role;
grant execute on function pg_temp.expect_affected(text, text, bigint)        to anon, authenticated, service_role;
grant execute on function pg_temp.expect_ok(text, text)                      to anon, authenticated, service_role;
grant execute on function pg_temp.expect_snapshot(text, uuid, boolean, boolean, boolean) to anon, authenticated;

-- ================================================== LAYER 0: CATALOG CONTRACT ==
do $$
declare
  r record;
  v_actual boolean;
  v_expected boolean;
  v_allow text[] := array[
    'authenticated.submissions.SELECT',
    'authenticated.coach_reviews.SELECT',
    'authenticated.coach_review_private_notes.SELECT',
    'service_role.app_users.SELECT',
    'service_role.app_users.INSERT',
    'service_role.member_access.SELECT',
    'service_role.member_access.INSERT',
    'service_role.member_access.UPDATE',
    'service_role.user_roles.SELECT',
    'service_role.user_roles.INSERT',
    'service_role.user_roles.UPDATE',
    'service_role.audit_events.INSERT'
  ];
begin
  -- Every public base table has RLS, entitlement_plans included.
  for r in
    select c.relname from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity
  loop
    raise exception 'RLS-DISABLED %', r.relname;
  end loop;

  -- Exact privilege matrix: anything unexpected, present or missing, fails.
  for r in
    select a.rol, t.tbl, p.priv
    from unnest(array['anon', 'authenticated', 'service_role']) a(rol)
    cross join unnest(array[
      'app_users', 'member_access', 'user_roles', 'submissions', 'video_assets',
      'coach_reviews', 'coach_review_private_notes', 'review_annotations',
      'entitlement_plans', 'monthly_entitlements', 'entitlement_grants',
      'data_retention_policies', 'deletion_requests', 'audit_events'
    ]) t(tbl)
    cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p(priv)
  loop
    v_actual := case when r.priv in ('SELECT','INSERT','UPDATE','REFERENCES')
      then has_any_column_privilege(r.rol::name, 'public.' || r.tbl, r.priv)
      else has_table_privilege(r.rol::name, 'public.' || r.tbl, r.priv) end;
    v_expected := (r.rol || '.' || r.tbl || '.' || r.priv) = any(v_allow);
    if v_actual is distinct from v_expected then
      raise exception 'GRANT-MISMATCH %.%.%: expected %, actual %', r.rol, r.tbl, r.priv, v_expected, v_actual;
    end if;
  end loop;

  -- coach_reviews is column-limited: internal columns are never granted.
  if has_table_privilege('authenticated', 'public.coach_reviews', 'SELECT') then
    raise exception 'COLUMN-GRANT coach_reviews has table-wide SELECT';
  end if;
  if has_column_privilege('authenticated', 'public.coach_reviews', 'coach_notes', 'SELECT') then
    raise exception 'COLUMN-GRANT coach_notes is readable';
  end if;
  if has_column_privilege('authenticated', 'public.coach_reviews', 'published_by', 'SELECT') then
    raise exception 'COLUMN-GRANT published_by is readable';
  end if;
  if not has_column_privilege('authenticated', 'public.coach_reviews', 'feedback', 'SELECT') then
    raise exception 'COLUMN-GRANT feedback is not readable';
  end if;

  -- Function privileges.
  for r in select unnest(array[
    'public.transition_submission(uuid, public.submission_status, public.app_role)',
    'public.ensure_entitlement(uuid, date, text)',
    'public.claim_entitlement(uuid, date, uuid)',
    'public.release_entitlement(uuid)',
    'public.grant_entitlement(uuid, date, integer, text, uuid)',
    'public.has_role(uuid, public.app_role)'
  ]) as fn loop
    if has_function_privilege('anon', r.fn, 'EXECUTE') or has_function_privilege('authenticated', r.fn, 'EXECUTE') then
      raise exception 'FUNCTION-GRANT browser role can execute %', r.fn;
    end if;
    if not has_function_privilege('service_role', r.fn, 'EXECUTE') then
      raise exception 'FUNCTION-GRANT service_role cannot execute %', r.fn;
    end if;
  end loop;

  -- Unsafe write policies stay removed; only the tightened deletion insert remains.
  for r in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('submissions', 'coach_reviews', 'coach_review_private_notes', 'review_annotations',
                        'user_roles', 'member_access', 'app_users', 'entitlement_plans')
      and cmd <> 'SELECT'
  loop
    raise exception 'POLICY-UNSAFE write policy % on %', r.policyname, r.tablename;
  end loop;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'entitlement_plans') then
    raise exception 'POLICY-UNSAFE entitlement_plans must have no policy';
  end if;

  -- The old column is empty and cannot be refilled.
  if exists (select 1 from public.coach_reviews where coach_notes is not null) then
    raise exception 'DATA-MOVE coach_reviews.coach_notes still holds data';
  end if;
  begin
    update public.coach_reviews set coach_notes = 'x' where id = '30000000-0000-4000-a000-00000000000a';
    raise exception 'DATA-MOVE coach_notes could be written';
  exception when check_violation then null; end;

  -- Publishing requires real feedback.
  begin
    update public.coach_reviews set feedback = '  ' where id = '30000000-0000-4000-a000-00000000000a';
    raise exception 'DATA-MOVE published review accepted blank feedback';
  exception when check_violation then null; end;

  raise notice 'PASS catalog contract';
end $$;

-- ============================================================ ANONYMOUS ======
set local role anon;
select set_config('request.jwt.claims', '', true);
do $$
begin
  perform pg_temp.expect_snapshot('ANON-1', null, false, false, false);
  perform pg_temp.expect_denied('ANON-2',  'TABLE_PRIVILEGE', 'select count(*) from public.user_roles');
  perform pg_temp.expect_denied('ANON-3',  'TABLE_PRIVILEGE', 'select count(*) from public.app_users');
  perform pg_temp.expect_denied('ANON-4',  'TABLE_PRIVILEGE', 'select count(*) from public.member_access');
  perform pg_temp.expect_denied('ANON-5',  'TABLE_PRIVILEGE', 'select count(*) from public.submissions');
  perform pg_temp.expect_denied('ANON-6',  'TABLE_PRIVILEGE', 'select count(*) from public.coach_reviews');
  perform pg_temp.expect_denied('ANON-7',  'TABLE_PRIVILEGE', 'select count(*) from public.coach_review_private_notes');
  perform pg_temp.expect_denied('ANON-8',  'TABLE_PRIVILEGE', 'select count(*) from public.entitlement_plans');
  perform pg_temp.expect_denied('ANON-9',  'TABLE_PRIVILEGE', $q$insert into public.user_roles values ('10000000-0000-4000-a000-00000000000a', 'ADMIN')$q$);
  perform pg_temp.expect_denied('ANON-10', 'TABLE_PRIVILEGE', $q$update public.entitlement_plans set per_period = 999$q$);
  perform pg_temp.expect_denied('ANON-11', 'FUNCTION_PRIVILEGE', $q$select public.has_role('10000000-0000-4000-a000-00000000000d', 'ADMIN')$q$);
  perform pg_temp.expect_denied('ANON-12', 'FUNCTION_PRIVILEGE', $q$select public.grant_entitlement('10000000-0000-4000-a000-00000000000a', date '2026-11-01', 5, 'x', null)$q$);
  raise notice 'PASS anonymous';
end $$;
reset role;

-- ====================================================== UNMAPPED AUTH USER ==
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000ff","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_snapshot('UNMAPPED-1', null, false, false, false);
  perform pg_temp.expect_count('UNMAPPED-2', 'select count(*) from public.submissions', 0);
  perform pg_temp.expect_count('UNMAPPED-3', 'select count(*) from public.coach_reviews', 0);
  perform pg_temp.expect_count('UNMAPPED-4', 'select count(*) from public.coach_review_private_notes', 0);
  perform pg_temp.expect_denied('UNMAPPED-5', 'TABLE_PRIVILEGE', 'select count(*) from public.user_roles');
  raise notice 'PASS unmapped authenticated user';
end $$;
reset role;

-- ============================================================= MEMBER A =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000a","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_snapshot('MEMBER-A-1', '10000000-0000-4000-a000-00000000000a', true, false, false);

  -- Isolation: own data only (row policy).
  perform pg_temp.expect_count('MEMBER-A-2', 'select count(*) from public.submissions', 1);
  perform pg_temp.expect_count('MEMBER-A-3', $q$select count(*) from public.submissions where member_id = '10000000-0000-4000-a000-00000000000b'$q$, 0);
  perform pg_temp.expect_count('MEMBER-A-4', 'select count(*) from public.coach_reviews', 1);
  perform pg_temp.expect_count('MEMBER-A-5', $q$select count(*) from public.coach_reviews where feedback = 'published-for-a'$q$, 1);
  perform pg_temp.expect_count('MEMBER-A-6', $q$select count(*) from public.coach_reviews where feedback like '%-for-b'$q$, 0);

  -- Private notes: filtered by row policy on the new table, denied on the old column.
  perform pg_temp.expect_count('MEMBER-A-7', 'select count(*) from public.coach_review_private_notes', 0);
  perform pg_temp.expect_denied('MEMBER-A-8', 'TABLE_PRIVILEGE', 'select coach_notes from public.coach_reviews');
  perform pg_temp.expect_denied('MEMBER-A-9', 'TABLE_PRIVILEGE', 'select * from public.coach_reviews');
  perform pg_temp.expect_denied('MEMBER-A-10', 'TABLE_PRIVILEGE', 'select published_by from public.coach_reviews');

  -- No direct writes: quota and state machine cannot be bypassed.
  perform pg_temp.expect_denied('MEMBER-A-11', 'TABLE_PRIVILEGE', $q$insert into public.submissions (member_id, status, analysis_type, goal) values ('10000000-0000-4000-a000-00000000000a', 'COMPLETED', 'x', 'x')$q$);
  perform pg_temp.expect_denied('MEMBER-A-12', 'TABLE_PRIVILEGE', $q$update public.submissions set status = 'COMPLETED' where id = '20000000-0000-4000-a000-00000000000a'$q$);
  perform pg_temp.expect_denied('MEMBER-A-13', 'TABLE_PRIVILEGE', $q$update public.submissions set notes = 'tamper' where member_id = '10000000-0000-4000-a000-00000000000b'$q$);
  perform pg_temp.expect_denied('MEMBER-A-14', 'TABLE_PRIVILEGE', $q$delete from public.submissions where id = '20000000-0000-4000-a000-00000000000a'$q$);
  perform pg_temp.expect_denied('MEMBER-A-15', 'TABLE_PRIVILEGE', $q$update public.coach_reviews set feedback = 'tamper'$q$);
  perform pg_temp.expect_denied('MEMBER-A-16', 'TABLE_PRIVILEGE', $q$insert into public.coach_review_private_notes (review_id, body) values ('30000000-0000-4000-a000-0000000000b2', 'x')$q$);

  -- Roles and entitlements.
  perform pg_temp.expect_denied('MEMBER-A-17', 'TABLE_PRIVILEGE', 'select count(*) from public.user_roles');
  perform pg_temp.expect_denied('MEMBER-A-18', 'TABLE_PRIVILEGE', 'select count(*) from public.member_access');
  perform pg_temp.expect_denied('MEMBER-A-19', 'TABLE_PRIVILEGE', $q$insert into public.user_roles values ('10000000-0000-4000-a000-00000000000a', 'ADMIN')$q$);
  perform pg_temp.expect_denied('MEMBER-A-20', 'TABLE_PRIVILEGE', $q$update public.member_access set valid_until = null where app_user_id = '10000000-0000-4000-a000-00000000000a'$q$);
  perform pg_temp.expect_denied('MEMBER-A-21', 'TABLE_PRIVILEGE', $q$update public.entitlement_plans set per_period = 999$q$);

  -- Privileged functions.
  perform pg_temp.expect_denied('MEMBER-A-22', 'FUNCTION_PRIVILEGE', $q$select public.has_role('10000000-0000-4000-a000-00000000000d', 'ADMIN')$q$);
  perform pg_temp.expect_denied('MEMBER-A-23', 'FUNCTION_PRIVILEGE', $q$select public.transition_submission('20000000-0000-4000-a000-00000000000a', 'COMPLETED', 'ADMIN')$q$);
  perform pg_temp.expect_denied('MEMBER-A-24', 'FUNCTION_PRIVILEGE', $q$select public.ensure_entitlement('10000000-0000-4000-a000-00000000000a', date '2026-11-01', 'UNLIMITED')$q$);
  perform pg_temp.expect_denied('MEMBER-A-25', 'FUNCTION_PRIVILEGE', $q$select public.claim_entitlement('10000000-0000-4000-a000-00000000000a', date '2026-11-01', '20000000-0000-4000-a000-00000000000a')$q$);
  perform pg_temp.expect_denied('MEMBER-A-26', 'FUNCTION_PRIVILEGE', $q$select public.release_entitlement('20000000-0000-4000-a000-00000000000a')$q$);
  perform pg_temp.expect_denied('MEMBER-A-27', 'FUNCTION_PRIVILEGE', $q$select public.grant_entitlement('10000000-0000-4000-a000-00000000000a', date '2026-11-01', 5, 'x', null)$q$);
  raise notice 'PASS member A';
end $$;
reset role;

-- ============================================================= MEMBER B =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000b","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_snapshot('MEMBER-B-1', '10000000-0000-4000-a000-00000000000b', true, false, false);
  perform pg_temp.expect_count('MEMBER-B-2', 'select count(*) from public.submissions', 2);
  perform pg_temp.expect_count('MEMBER-B-3', $q$select count(*) from public.coach_reviews where feedback = 'published-for-b'$q$, 1);
  perform pg_temp.expect_count('MEMBER-B-4', $q$select count(*) from public.coach_reviews where id = '30000000-0000-4000-a000-0000000000b2'$q$, 0);
  perform pg_temp.expect_count('MEMBER-B-5', $q$select count(*) from public.coach_reviews where feedback = 'published-for-a'$q$, 0);
  perform pg_temp.expect_count('MEMBER-B-6', 'select count(*) from public.coach_review_private_notes', 0);
  raise notice 'PASS member B';
end $$;
reset role;

-- =========================================== EXPIRED, REVOKED, NOT-YET-VALID ==
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000e","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_snapshot('EXPIRED-1', '10000000-0000-4000-a000-00000000000e', false, false, false);
  perform pg_temp.expect_count('EXPIRED-2', 'select count(*) from public.submissions', 0);
  perform pg_temp.expect_count('EXPIRED-3', 'select count(*) from public.coach_reviews', 0);
  raise notice 'PASS expired member';
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000a1","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_snapshot('REVOKED-1', '10000000-0000-4000-a000-0000000000a1', false, false, false);
  perform pg_temp.expect_count('REVOKED-2', 'select count(*) from public.submissions', 0);
  perform pg_temp.expect_count('REVOKED-3', 'select count(*) from public.coach_reviews', 0);
  raise notice 'PASS revoked member';
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000f1","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_snapshot('FUTURE-1', '10000000-0000-4000-a000-0000000000f1', false, false, false);
  perform pg_temp.expect_count('FUTURE-2', 'select count(*) from public.submissions', 0);
  raise notice 'PASS not-yet-valid member';
end $$;
reset role;

-- ============================================================== COACH C =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000c","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_snapshot('COACH-1', '10000000-0000-4000-a000-00000000000c', false, true, false);
  perform pg_temp.expect_count('COACH-2', 'select count(*) from public.submissions where member_id in (select id from fx)', 6);
  -- Coaches see drafts as well as published feedback.
  perform pg_temp.expect_count('COACH-3', $q$select count(*) from public.coach_reviews where coach_id = '10000000-0000-4000-a000-00000000000c' and submission_id::text like '20000000-0000-4000-a000-%'$q$, 5);
  perform pg_temp.expect_count('COACH-4', $q$select count(*) from public.coach_reviews where feedback = 'draft-for-b'$q$, 1);
  perform pg_temp.expect_count('COACH-5', $q$select count(*) from public.coach_review_private_notes where body like 'private-about-%'$q$, 2);

  -- The old column is closed to everyone, staff included.
  perform pg_temp.expect_denied('COACH-6', 'TABLE_PRIVILEGE', 'select coach_notes from public.coach_reviews');

  -- Writes go through server functions, not direct table access.
  perform pg_temp.expect_denied('COACH-7',  'TABLE_PRIVILEGE', $q$update public.submissions set status = 'COMPLETED' where id = '20000000-0000-4000-a000-00000000000b'$q$);
  perform pg_temp.expect_denied('COACH-8',  'TABLE_PRIVILEGE', $q$update public.coach_reviews set published_at = now() where id = '30000000-0000-4000-a000-0000000000b2'$q$);
  perform pg_temp.expect_denied('COACH-9',  'TABLE_PRIVILEGE', $q$update public.coach_review_private_notes set body = 'x'$q$);
  perform pg_temp.expect_denied('COACH-10', 'TABLE_PRIVILEGE', $q$insert into public.user_roles values ('10000000-0000-4000-a000-00000000000c', 'ADMIN')$q$);
  perform pg_temp.expect_denied('COACH-11', 'TABLE_PRIVILEGE', 'select count(*) from public.user_roles');
  perform pg_temp.expect_denied('COACH-12', 'FUNCTION_PRIVILEGE', $q$select public.transition_submission('20000000-0000-4000-a000-00000000000b', 'IN_REVIEW', 'COACH')$q$);
  raise notice 'PASS coach';
end $$;
reset role;

-- ======================================================== COACH+ADMIN D =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000d","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_snapshot('ADMIN-1', '10000000-0000-4000-a000-00000000000d', false, true, true);
  perform pg_temp.expect_count('ADMIN-2', 'select count(*) from public.submissions where member_id in (select id from fx)', 6);
  perform pg_temp.expect_count('ADMIN-3', $q$select count(*) from public.coach_review_private_notes where body like 'private-about-%'$q$, 2);
  perform pg_temp.expect_denied('ADMIN-4', 'TABLE_PRIVILEGE', $q$insert into public.user_roles values ('10000000-0000-4000-a000-00000000000a', 'COACH')$q$);
  perform pg_temp.expect_denied('ADMIN-5', 'TABLE_PRIVILEGE', 'select count(*) from public.member_access');
  raise notice 'PASS coach+admin';
end $$;
reset role;

-- ============================================= DORMANT POLICY DEFENCE IN DEPTH ==
-- Grants added ONLY inside this rolled-back transaction: if a future migration
-- grants table access, the row policies must still hold on their own.
grant select on public.user_roles, public.member_access, public.app_users to authenticated;
grant insert, update, delete on public.submissions to authenticated;
grant insert, update, delete on public.coach_reviews to authenticated;
grant insert, update on public.coach_review_private_notes to authenticated;
grant select, insert on public.review_annotations to authenticated;
grant insert on public.deletion_requests to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000a","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_count('DORMANT-A-1', 'select count(*) from public.user_roles', 1);
  perform pg_temp.expect_count('DORMANT-A-2', 'select count(*) from public.member_access', 1);
  perform pg_temp.expect_count('DORMANT-A-3', 'select count(*) from public.app_users', 1);
  perform pg_temp.expect_denied('DORMANT-A-4', 'RLS_WITH_CHECK', $q$insert into public.submissions (member_id, status, analysis_type, goal) values ('10000000-0000-4000-a000-00000000000a', 'COMPLETED', 'x', 'x')$q$);
  perform pg_temp.expect_denied('DORMANT-A-5', 'RLS_WITH_CHECK', $q$insert into public.submissions (member_id, status, analysis_type, goal) values ('10000000-0000-4000-a000-00000000000b', 'DRAFT', 'x', 'x')$q$);
  perform pg_temp.expect_affected('DORMANT-A-6', $q$update public.submissions set status = 'COMPLETED' where id = '20000000-0000-4000-a000-00000000000a'$q$, 0);
  perform pg_temp.expect_affected('DORMANT-A-7', $q$delete from public.submissions where id = '20000000-0000-4000-a000-00000000000a'$q$, 0);
  perform pg_temp.expect_affected('DORMANT-A-8', $q$update public.coach_reviews set feedback = 'tamper' where id = '30000000-0000-4000-a000-00000000000a'$q$, 0);
  perform pg_temp.expect_count('DORMANT-A-9', 'select count(*) from public.review_annotations', 0);

  -- Data-subject requests: own + RECEIVED only.
  perform pg_temp.expect_ok('DORMANT-A-10', $q$insert into public.deletion_requests (subject_member_id, request_type) values ('10000000-0000-4000-a000-00000000000a', 'EXPORT')$q$);
  perform pg_temp.expect_denied('DORMANT-A-11', 'RLS_WITH_CHECK', $q$insert into public.deletion_requests (subject_member_id, request_type, status) values ('10000000-0000-4000-a000-00000000000a', 'EXPORT', 'APPROVED')$q$);
  perform pg_temp.expect_denied('DORMANT-A-12', 'RLS_WITH_CHECK', $q$insert into public.deletion_requests (subject_member_id, request_type) values ('10000000-0000-4000-a000-00000000000b', 'EXPORT')$q$);
  perform pg_temp.expect_denied('DORMANT-A-13', 'RLS_WITH_CHECK', $q$insert into public.deletion_requests (subject_member_id, request_type) values ('10000000-0000-4000-a000-00000000000a', 'ANYTHING')$q$);
  raise notice 'PASS dormant policies: member';
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000e","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_denied('DORMANT-E-1', 'RLS_WITH_CHECK', $q$insert into public.submissions (member_id, status, analysis_type, goal) values ('10000000-0000-4000-a000-00000000000e', 'DRAFT', 'x', 'x')$q$);
  -- Data-subject rights do not depend on entitlement.
  perform pg_temp.expect_ok('DORMANT-E-2', $q$insert into public.deletion_requests (subject_member_id, request_type) values ('10000000-0000-4000-a000-00000000000e', 'ACCOUNT_DELETE')$q$);
  raise notice 'PASS dormant policies: expired member';
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000c","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_count('DORMANT-C-1', 'select count(*) from public.user_roles', 1);
  perform pg_temp.expect_count('DORMANT-C-2', 'select count(*) from public.member_access', 0);
  perform pg_temp.expect_affected('DORMANT-C-3', $q$update public.submissions set status = 'COMPLETED' where id = '20000000-0000-4000-a000-00000000000b'$q$, 0);
  perform pg_temp.expect_denied('DORMANT-C-4', 'RLS_WITH_CHECK', $q$insert into public.coach_reviews (submission_id, coach_id, feedback) values ('20000000-0000-4000-a000-00000000000f', '10000000-0000-4000-a000-00000000000d', 'x')$q$);
  perform pg_temp.expect_affected('DORMANT-C-5', $q$update public.coach_reviews set coach_id = '10000000-0000-4000-a000-00000000000d' where id = '30000000-0000-4000-a000-00000000000a'$q$, 0);
  perform pg_temp.expect_denied('DORMANT-C-6', 'RLS_WITH_CHECK', $q$insert into public.coach_review_private_notes (review_id, body) values ('30000000-0000-4000-a000-0000000000b2', 'x')$q$);
  perform pg_temp.expect_affected('DORMANT-C-7', $q$update public.coach_review_private_notes set body = 'x' where review_id = '30000000-0000-4000-a000-00000000000a'$q$, 0);
  perform pg_temp.expect_denied('DORMANT-C-8', 'RLS_WITH_CHECK', $q$insert into public.review_annotations (review_id, body) values ('30000000-0000-4000-a000-00000000000a', 'x')$q$);
  raise notice 'PASS dormant policies: coach';
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000d","role":"authenticated"}', true);
do $$
begin
  perform pg_temp.expect_count('DORMANT-D-1', 'select count(*) from public.user_roles where app_user_id in (select id from fx)', 8);
  perform pg_temp.expect_count('DORMANT-D-2', 'select count(*) from public.member_access where app_user_id in (select id from fx)', 5);
  perform pg_temp.expect_affected('DORMANT-D-3', $q$update public.submissions set status = 'COMPLETED' where id = '20000000-0000-4000-a000-00000000000b'$q$, 0);
  raise notice 'PASS dormant policies: admin';
end $$;
reset role;

-- ========================================================== SERVICE ROLE =====
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$
begin
  -- The exact sequence in src/services/auth/provisioning.ts, upserts run twice.
  perform pg_temp.expect_ok('SERVICE-1', $q$insert into public.app_users (id, auth_user_id, contact_email) values ('10000000-0000-4000-a000-0000000000b1', '00000000-0000-4000-a000-0000000000b1', 'rls-provisioned@example.test') returning id$q$);
  perform pg_temp.expect_count('SERVICE-2', $q$select count(*) from public.app_users where auth_user_id = '00000000-0000-4000-a000-0000000000b1'$q$, 1);
  perform pg_temp.expect_ok('SERVICE-3', $q$insert into public.member_access (app_user_id, is_active, source, verified_at) values ('10000000-0000-4000-a000-0000000000b1', true, 'test', now()) on conflict (app_user_id) do update set is_active = excluded.is_active, source = excluded.source, verified_at = excluded.verified_at$q$);
  perform pg_temp.expect_ok('SERVICE-4', $q$insert into public.member_access (app_user_id, is_active, source, verified_at) values ('10000000-0000-4000-a000-0000000000b1', true, 'test2', now()) on conflict (app_user_id) do update set is_active = excluded.is_active, source = excluded.source, verified_at = excluded.verified_at$q$);
  perform pg_temp.expect_ok('SERVICE-5', $q$insert into public.user_roles (app_user_id, role) values ('10000000-0000-4000-a000-0000000000b1', 'MEMBER') on conflict (app_user_id, role) do update set app_user_id = excluded.app_user_id, role = excluded.role$q$);
  perform pg_temp.expect_ok('SERVICE-6', $q$insert into public.user_roles (app_user_id, role) values ('10000000-0000-4000-a000-0000000000b1', 'MEMBER') on conflict (app_user_id, role) do update set app_user_id = excluded.app_user_id, role = excluded.role$q$);
  perform pg_temp.expect_ok('SERVICE-7', $q$insert into public.audit_events (action, entity, entity_id, metadata) values ('member.provisioned', 'member_access', '10000000-0000-4000-a000-0000000000b1', '{}')$q$);
  perform pg_temp.expect_affected('SERVICE-8', $q$update public.member_access set is_active = false, note = 'test' where app_user_id = '10000000-0000-4000-a000-0000000000b1'$q$, 1);

  -- Privileged functions run as owner, so they need no table grant.
  perform pg_temp.expect_ok('SERVICE-9',  $q$select public.has_role('10000000-0000-4000-a000-00000000000d', 'ADMIN')$q$);
  perform pg_temp.expect_ok('SERVICE-10', $q$select public.transition_submission('20000000-0000-4000-a000-00000000000b', 'IN_REVIEW', 'COACH')$q$);
  perform pg_temp.expect_ok('SERVICE-11', $q$select public.ensure_entitlement('10000000-0000-4000-a000-00000000000a', date '2026-11-01', 'TRIAL_1_MONTH')$q$);
  perform pg_temp.expect_ok('SERVICE-12', $q$select public.claim_entitlement('10000000-0000-4000-a000-00000000000a', date '2026-11-01', '20000000-0000-4000-a000-00000000000a')$q$);
  perform pg_temp.expect_ok('SERVICE-13', $q$select public.release_entitlement('20000000-0000-4000-a000-00000000000a')$q$);
  perform pg_temp.expect_ok('SERVICE-14', $q$select public.grant_entitlement('10000000-0000-4000-a000-00000000000a', date '2026-11-01', 1, 'test', null)$q$);

  -- Nothing beyond the allowlist, despite BYPASSRLS.
  perform pg_temp.expect_denied('SERVICE-15', 'TABLE_PRIVILEGE', 'select count(*) from public.audit_events');
  perform pg_temp.expect_denied('SERVICE-16', 'TABLE_PRIVILEGE', 'delete from public.audit_events');
  perform pg_temp.expect_denied('SERVICE-17', 'TABLE_PRIVILEGE', 'select count(*) from public.submissions');
  perform pg_temp.expect_denied('SERVICE-18', 'TABLE_PRIVILEGE', 'select count(*) from public.coach_reviews');
  perform pg_temp.expect_denied('SERVICE-19', 'TABLE_PRIVILEGE', 'select count(*) from public.coach_review_private_notes');
  perform pg_temp.expect_denied('SERVICE-20', 'TABLE_PRIVILEGE', 'select count(*) from public.entitlement_plans');
  perform pg_temp.expect_denied('SERVICE-21', 'TABLE_PRIVILEGE', $q$delete from public.app_users where id = '10000000-0000-4000-a000-0000000000b1'$q$);
  raise notice 'PASS service_role';
end $$;
reset role;

rollback;

-- Reached only if nothing above raised. Also proves the fixtures are gone.
select 'ALL PHASE 2B ASSERTIONS PASSED' as result,
  (select count(*) from public.app_users where id::text like '10000000-0000-4000-a000-%')
  + (select count(*) from auth.users where email like 'rls-%@example.test') as leftover_fixtures;
