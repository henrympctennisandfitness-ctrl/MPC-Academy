-- 0011_explicit_privileges_private_notes.sql
-- PHASE 2B — explicit table privileges, private coach notes, published feedback.
-- ADDITIVE. Does NOT edit 0001–0010. PROPOSED: apply only with explicit approval.
--
-- WHY THIS EXISTS
--   0001–0010 never GRANT table privileges; they assumed Supabase's default grants
--   (the local shim reproduced those defaults, which hid the gap). The development
--   project has no such grants, so anon, authenticated AND service_role hold no
--   table privileges. BYPASSRLS skips policies only; it does not replace GRANT.
--   This migration states the intended privileges and converges to the same result
--   whether or not a project starts with Supabase's default grants.
--
-- WHAT IT DOES
--   1. Adds deliberate publication to coach_reviews (published_at / published_by).
--      Existing reviews stay UNPUBLISHED: nothing was ever deliberately published.
--   2. Moves coach_notes into coach_review_private_notes (staff-only row policy).
--      coach and member share the `authenticated` role, so a column grant cannot
--      show the notes to one and hide them from the other; a separate table can.
--      Every value is copied verbatim and verified before the old column is
--      cleared. The old column is kept, empty, and is now constrained to stay empty.
--   3. Removes write policies with no application operation behind them:
--      submissions_member_insert (any status, skips the quota),
--      submissions_coach_update (any column, skips transition_submission()),
--      coach_reviews_write (any coach_id) and review_annotations_rw.
--      Writes are denied by missing grants AND by missing policies. Phase 3 adds
--      definer wrappers that derive the actor from auth.uid().
--   4. Tightens deletion_requests_insert (caller could set status/processed_at).
--   5. Enables RLS on entitlement_plans (no policy: definer functions only).
--   6. Revokes every direct privilege, then grants only the allowlist below.
--
-- PRIVILEGES AFTER THIS MIGRATION (everything else: none)
--   anon           no table privileges (RPC: current_access_snapshot only).
--   authenticated  submissions                  SELECT
--                  coach_reviews                SELECT on published columns only
--                  coach_review_private_notes   SELECT (row policy: COACH/ADMIN)
--   service_role   app_users                    SELECT, INSERT
--                  member_access, user_roles    SELECT, INSERT, UPDATE
--                  audit_events                 INSERT
--
-- ATOMIC: send this file as ONE statement batch (SQL Editor or CLI). A failed
-- pre/post-condition raises and nothing is applied. It refuses a second apply.

-- ---------------------------------------------------------------------------
-- 0) Preconditions.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.coach_review_private_notes') is not null then
    raise exception '0011 already applied: coach_review_private_notes exists';
  end if;
  if not exists (
    select 1 from pg_proc
    where oid = to_regprocedure('public.current_user_has_role(public.app_role)')
      and prosecdef
  ) then
    raise exception '0011 requires 0010: current_user_has_role is not SECURITY DEFINER';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coach_reviews'
      and column_name = 'coach_notes'
  ) then
    raise exception '0011 requires public.coach_reviews.coach_notes';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1) Deliberate publication of feedback.
-- ---------------------------------------------------------------------------
alter table public.coach_reviews
  add column published_at timestamptz,
  add column published_by uuid references public.app_users(id) on delete set null,
  add constraint coach_reviews_published_requires_feedback
    check (published_at is null or nullif(btrim(feedback), '') is not null);

-- ---------------------------------------------------------------------------
-- 2) Private coach notes: own table, staff-only.
-- ---------------------------------------------------------------------------
create table public.coach_review_private_notes (
  review_id  uuid primary key references public.coach_reviews(id) on delete cascade,
  body       text not null,
  author_id  uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger coach_review_private_notes_set_updated
  before update on public.coach_review_private_notes
  for each row execute function public.set_updated_at();

alter table public.coach_review_private_notes enable row level security;
create policy coach_review_private_notes_staff_select
  on public.coach_review_private_notes for select
  using (public.current_user_has_role('COACH') or public.current_user_has_role('ADMIN'));

-- Move existing notes verbatim, verify, then clear the member-adjacent column.
insert into public.coach_review_private_notes (review_id, body, author_id, created_at, updated_at)
  select id, coach_notes, coach_id, created_at, updated_at
  from public.coach_reviews
  where coach_notes is not null;

do $$
begin
  if exists (
    select 1
    from public.coach_reviews r
    left join public.coach_review_private_notes n on n.review_id = r.id
    where r.coach_notes is not null and n.body is distinct from r.coach_notes
  ) then
    raise exception '0011 aborted: a coach note was not copied exactly';
  end if;
end $$;

-- Clearing a column is not a review edit, so updated_at must not move.
alter table public.coach_reviews disable trigger coach_reviews_set_updated;
update public.coach_reviews set coach_notes = null where coach_notes is not null;
alter table public.coach_reviews enable trigger coach_reviews_set_updated;

alter table public.coach_reviews
  add constraint coach_reviews_no_inline_private_notes check (coach_notes is null);

-- ---------------------------------------------------------------------------
-- 3) Policies: remove unsafe writes, gate member reads on publication.
-- ---------------------------------------------------------------------------
drop policy if exists submissions_member_insert on public.submissions;
drop policy if exists submissions_coach_update  on public.submissions;
drop policy if exists coach_reviews_write       on public.coach_reviews;
drop policy if exists review_annotations_rw     on public.review_annotations;

drop policy if exists coach_reviews_select on public.coach_reviews;
create policy coach_reviews_select on public.coach_reviews for select
  using (
    public.current_user_has_role('COACH')
    or public.current_user_has_role('ADMIN')
    or (
      published_at is not null
      and exists (
        select 1 from public.submissions s
        where s.id = coach_reviews.submission_id
          and s.member_id = public.current_entitled_member_id()
      )
    )
  );

-- Annotations stay staff-only; the write half of the old FOR ALL policy is gone.
create policy review_annotations_staff_select on public.review_annotations for select
  using (public.current_user_has_role('COACH') or public.current_user_has_role('ADMIN'));

-- Data-subject requests keep working without an entitlement, but the caller can
-- no longer choose the workflow state or file on another person's behalf.
drop policy if exists deletion_requests_insert on public.deletion_requests;
create policy deletion_requests_insert on public.deletion_requests for insert
  with check (
    subject_member_id = public.current_app_user_id()
    and request_type in ('EXPORT', 'VIDEO_DELETE', 'SUBMISSION_DELETE', 'ACCOUNT_DELETE')
    and status = 'RECEIVED'
    and processed_at is null
    and notes = ''
  );

-- ---------------------------------------------------------------------------
-- 4) entitlement_plans: RLS on, no policy. FORCE is deliberately not used: the
--    entitlement functions read this table as its owner.
-- ---------------------------------------------------------------------------
alter table public.entitlement_plans enable row level security;

-- ---------------------------------------------------------------------------
-- 5) Privileges: clear everything, then grant only the allowlist.
-- ---------------------------------------------------------------------------
revoke all on table
  public.app_users, public.member_access, public.user_roles, public.submissions,
  public.video_assets, public.coach_reviews, public.coach_review_private_notes,
  public.review_annotations, public.entitlement_plans, public.monthly_entitlements,
  public.entitlement_grants, public.data_retention_policies, public.deletion_requests,
  public.audit_events
from public, anon, authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;

-- authenticated: reads only, always filtered by the row policies.
grant select on table public.submissions to authenticated;
grant select (id, submission_id, coach_id, feedback, completed_at, published_at, created_at, updated_at)
  on table public.coach_reviews to authenticated;
grant select on table public.coach_review_private_notes to authenticated;

-- service_role: exactly what src/services/auth/provisioning.ts performs.
-- UPDATE on user_roles is required by its upsert. audit_events is append-only.
grant select, insert         on table public.app_users     to service_role;
grant select, insert, update on table public.member_access to service_role;
grant select, insert, update on table public.user_roles    to service_role;
grant insert                 on table public.audit_events  to service_role;

-- New tables and sequences start with no access; each migration grants explicitly.
alter default privileges in schema public
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema public
  revoke all on sequences from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6) Postconditions: any failure aborts the whole migration.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'app_users', 'member_access', 'user_roles', 'submissions', 'video_assets',
    'coach_reviews', 'coach_review_private_notes', 'review_annotations',
    'entitlement_plans', 'monthly_entitlements', 'entitlement_grants',
    'data_retention_policies', 'deletion_requests', 'audit_events'
  ] loop
    if not (select relrowsecurity from pg_class where oid = to_regclass('public.' || t)) then
      raise exception '0011 postcondition: RLS is not enabled on %', t;
    end if;
    if has_any_column_privilege('anon', 'public.' || t, 'SELECT') then
      raise exception '0011 postcondition: anon can read %', t;
    end if;
  end loop;

  if has_column_privilege('authenticated', 'public.coach_reviews', 'coach_notes', 'SELECT') then
    raise exception '0011 postcondition: authenticated can read coach_reviews.coach_notes';
  end if;
  if has_table_privilege('authenticated', 'public.submissions', 'INSERT')
     or has_table_privilege('authenticated', 'public.submissions', 'UPDATE') then
    raise exception '0011 postcondition: authenticated can write submissions';
  end if;
  if exists (select 1 from public.coach_reviews where coach_notes is not null) then
    raise exception '0011 postcondition: coach_reviews.coach_notes still holds data';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 7) Reviewer documentation (no privilege effect).
-- ---------------------------------------------------------------------------
comment on table public.coach_review_private_notes is
  'Internal coach notes. COACH/ADMIN only by row policy; never shown to members.';
comment on column public.coach_reviews.coach_notes is
  'DEPRECATED by 0011: always NULL (constraint). Use coach_review_private_notes.';
comment on column public.coach_reviews.published_at is
  'Set when a coach deliberately publishes feedback. Members see only published reviews.';

notify pgrst, 'reload schema';
