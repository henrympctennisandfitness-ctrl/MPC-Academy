-- 0006_rls_policies.sql
-- Row Level Security on every member/coaching table.
--
-- IMPORTANT (Phase 2 dependency): member-ownership policies use current_app_user_id(),
-- which resolves from a GUC that a VERIFIED session sets in Phase 2. Until then it is
-- NULL, so those policies DENY by default. This is a safe posture, NOT a bypass.
--   * Dev/tests set app.current_member_id via set_config() to exercise policies.
--   * The service role (server-only, never in the browser) bypasses RLS for
--     migrations/admin tasks and SECURITY DEFINER functions.
-- RLS is NEVER disabled as a workaround.

alter table app_users               enable row level security;
alter table member_access           enable row level security;
alter table user_roles              enable row level security;
alter table submissions             enable row level security;
alter table video_assets            enable row level security;
alter table coach_reviews           enable row level security;
alter table review_annotations      enable row level security;
alter table monthly_entitlements    enable row level security;
alter table entitlement_grants      enable row level security;
alter table data_retention_policies enable row level security;
alter table deletion_requests       enable row level security;
alter table audit_events            enable row level security;

-- Identity
create policy app_users_self_select on app_users for select
  using (id = current_app_user_id()
      or current_user_has_role('COACH') or current_user_has_role('ADMIN'));

create policy member_access_self on member_access for select
  using (app_user_id = current_app_user_id() or current_user_has_role('ADMIN'));

create policy user_roles_self on user_roles for select
  using (app_user_id = current_app_user_id() or current_user_has_role('ADMIN'));

-- Submissions: member owns own; coaches/admins see coaching submissions.
create policy submissions_select on submissions for select
  using (member_id = current_app_user_id()
      or current_user_has_role('COACH') or current_user_has_role('ADMIN'));
create policy submissions_member_insert on submissions for insert
  with check (member_id = current_app_user_id());
-- Coaching workflow updates via coaches/admins (status changes go through transition_submission()).
create policy submissions_coach_update on submissions for update
  using (current_user_has_role('COACH') or current_user_has_role('ADMIN'))
  with check (current_user_has_role('COACH') or current_user_has_role('ADMIN'));

-- Video: follows submission ownership.
create policy video_assets_select on video_assets for select
  using (exists (select 1 from submissions s
                 where s.id = video_assets.submission_id
                   and (s.member_id = current_app_user_id()
                        or current_user_has_role('COACH') or current_user_has_role('ADMIN'))));

-- Reviews: member reads reviews of own submissions; coaches/admins read+write.
create policy coach_reviews_select on coach_reviews for select
  using (exists (select 1 from submissions s
                 where s.id = coach_reviews.submission_id
                   and (s.member_id = current_app_user_id()
                        or current_user_has_role('COACH') or current_user_has_role('ADMIN'))));
create policy coach_reviews_write on coach_reviews for all
  using (current_user_has_role('COACH') or current_user_has_role('ADMIN'))
  with check (current_user_has_role('COACH') or current_user_has_role('ADMIN'));

create policy review_annotations_rw on review_annotations for all
  using (current_user_has_role('COACH') or current_user_has_role('ADMIN'))
  with check (current_user_has_role('COACH') or current_user_has_role('ADMIN'));

-- Entitlements: member reads own; writes only through SECURITY DEFINER functions / service role.
create policy monthly_entitlements_self on monthly_entitlements for select
  using (member_id = current_app_user_id() or current_user_has_role('ADMIN'));
create policy entitlement_grants_self on entitlement_grants for select
  using (member_id = current_app_user_id() or current_user_has_role('ADMIN'));

-- Privacy / audit: admin-managed; a member may see + file their own deletion requests.
create policy drp_admin_read on data_retention_policies for select
  using (current_user_has_role('ADMIN'));
create policy deletion_requests_self on deletion_requests for select
  using (subject_member_id = current_app_user_id() or current_user_has_role('ADMIN'));
create policy deletion_requests_insert on deletion_requests for insert
  with check (subject_member_id = current_app_user_id() or current_user_has_role('ADMIN'));
create policy audit_events_admin_read on audit_events for select
  using (current_user_has_role('ADMIN'));
