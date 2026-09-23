-- supabase/seed.sql
-- DEV SEED — obviously fictional identities only. NEVER production/real member data.
-- Applied to LOCAL/STAGING dev databases (e.g. `supabase db reset`). Not for production.

insert into app_users(id, status, contact_email) values
  ('00000000-0000-4000-8000-000000000001','active','coach.henry@example.test'),
  ('00000000-0000-4000-8000-000000000002','active','coach.calum@example.test'),
  ('00000000-0000-4000-8000-000000000101','active','member.one@example.test'),
  ('00000000-0000-4000-8000-000000000102','active','member.two@example.test')
on conflict do nothing;

insert into user_roles(app_user_id, role) values
  ('00000000-0000-4000-8000-000000000001','COACH'),
  ('00000000-0000-4000-8000-000000000001','ADMIN'),
  ('00000000-0000-4000-8000-000000000002','COACH'),
  ('00000000-0000-4000-8000-000000000002','ADMIN'),
  ('00000000-0000-4000-8000-000000000101','MEMBER'),
  ('00000000-0000-4000-8000-000000000102','MEMBER')
on conflict do nothing;

insert into member_access(app_user_id, is_active, external_ref, verified_at) values
  ('00000000-0000-4000-8000-000000000101', true, 'DEV-EXT-101', now()),
  ('00000000-0000-4000-8000-000000000102', true, 'DEV-EXT-102', now())
on conflict do nothing;

insert into submissions(id, member_id, status, analysis_type, goal, notes, period) values
  ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000101','SUBMITTED','Serve','Power','Please check my toss','2026-09-01'),
  ('00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000102','COMPLETED','Backhand','Consistency','','2026-09-01')
on conflict do nothing;
