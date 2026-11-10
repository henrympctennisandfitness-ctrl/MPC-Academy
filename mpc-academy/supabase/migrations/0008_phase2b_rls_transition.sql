-- 0008_phase2b_rls_transition.sql
-- PHASE 2B — RLS transition. ADDITIVE (new migration; does not edit 0006).
--
-- Every Phase 1 policy already routes through current_app_user_id() and
-- current_user_has_role(), both of which now bind to the VERIFIED Supabase JWT
-- (0007). So identity/role policies become authenticated automatically and are
-- left as-is. This migration only tightens the MEMBER-scoped DATA policies to
-- additionally require an ACTIVE entitlement, by switching their member branch
-- from current_app_user_id() to current_entitled_member_id().
--
-- Policies reviewed and LEFT UNCHANGED (identity/role-based; not entitlement-gated
-- on purpose):
--   app_users_self_select, member_access_self, user_roles_self        -> a member
--     may always see their own identity/access/roles (needed by /access-required).
--   deletion_requests_self, deletion_requests_insert                  -> data-subject
--     rights must not depend on entitlement.
--   submissions_coach_update, coach_reviews_write, review_annotations_rw,
--   drp_admin_read, audit_events_admin_read                           -> role-based.
--
-- Writes to user_roles and member_access have NO policy in Phase 1 and none is
-- added here, so RLS denies them for every non-service role. Members therefore
-- cannot grant themselves a role (test 18) or an entitlement (test 19);
-- role/entitlement administration is performed only by the server-only,
-- service-role provisioning path.

-- Submissions -----------------------------------------------------------------
drop policy if exists submissions_select on submissions;
create policy submissions_select on submissions for select
  using (member_id = current_entitled_member_id()
      or current_user_has_role('COACH') or current_user_has_role('ADMIN'));

drop policy if exists submissions_member_insert on submissions;
create policy submissions_member_insert on submissions for insert
  with check (member_id = current_entitled_member_id());

-- Video assets (follow submission ownership) ----------------------------------
drop policy if exists video_assets_select on video_assets;
create policy video_assets_select on video_assets for select
  using (exists (select 1 from submissions s
                 where s.id = video_assets.submission_id
                   and (s.member_id = current_entitled_member_id()
                        or current_user_has_role('COACH') or current_user_has_role('ADMIN'))));

-- Coach reviews (member reads reviews of own submissions) ----------------------
drop policy if exists coach_reviews_select on coach_reviews;
create policy coach_reviews_select on coach_reviews for select
  using (exists (select 1 from submissions s
                 where s.id = coach_reviews.submission_id
                   and (s.member_id = current_entitled_member_id()
                        or current_user_has_role('COACH') or current_user_has_role('ADMIN'))));

-- Entitlement reads (member sees own; admin sees all) --------------------------
drop policy if exists monthly_entitlements_self on monthly_entitlements;
create policy monthly_entitlements_self on monthly_entitlements for select
  using (member_id = current_entitled_member_id() or current_user_has_role('ADMIN'));

drop policy if exists entitlement_grants_self on entitlement_grants;
create policy entitlement_grants_self on entitlement_grants for select
  using (member_id = current_entitled_member_id() or current_user_has_role('ADMIN'));

comment on policy submissions_select on submissions is
  'Phase 2B: member branch requires ACTIVE entitlement (current_entitled_member_id).';
