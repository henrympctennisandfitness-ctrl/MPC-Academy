-- supabase/tests/local/10_pre_0011_legacy_data.sql
--
-- LOCAL TEST HARNESS ONLY — NEVER RUN THIS ON A SUPABASE PROJECT.
--
-- Runs after 0010 and before 0011: creates reviews the old way, with inline
-- coach_notes, so the 0011 data move can be proven by 12_post_0011_data_moved.sql.

insert into public.app_users (id) values
  ('40000000-0000-4000-a000-000000000001'),
  ('40000000-0000-4000-a000-000000000002');

insert into public.submissions (id, member_id, status, analysis_type, goal) values
  ('41000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000001', 'COMPLETED', 'serve', 'legacy'),
  ('41000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000001', 'COMPLETED', 'lob',   'legacy');

insert into public.coach_reviews (id, submission_id, coach_id, feedback, coach_notes, completed_at, created_at, updated_at) values
  ('42000000-0000-4000-a000-000000000001', '41000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000002',
   'legacy feedback', 'legacy private note', '2026-01-02T00:00:00Z', '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z'),
  ('42000000-0000-4000-a000-000000000002', '41000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000002',
   'legacy feedback only', null, '2026-01-02T00:00:00Z', '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z');
