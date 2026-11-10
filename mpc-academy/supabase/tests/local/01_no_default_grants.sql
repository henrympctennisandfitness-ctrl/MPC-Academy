-- supabase/tests/local/01_no_default_grants.sql
--
-- LOCAL TEST HARNESS ONLY — NEVER RUN THIS ON A SUPABASE PROJECT.
--
-- Removes the shim's default table privileges so the harness matches a project
-- that does not auto-grant new tables (the MPC development project's state).
-- Migration 0011 must produce the same privileges from either starting point.

alter default privileges in schema public revoke all on tables    from anon, authenticated, service_role;
alter default privileges in schema public revoke all on sequences from anon, authenticated, service_role;
