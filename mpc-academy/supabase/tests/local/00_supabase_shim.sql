-- supabase/tests/local/00_supabase_shim.sql
--
-- LOCAL TEST HARNESS ONLY — NEVER RUN THIS ON A SUPABASE PROJECT.
--
-- Recreates, on a plain throwaway PostgreSQL database, the small part of a
-- Supabase database that migrations 0001–0010 depend on, so the RLS / function
-- privilege behaviour can be exercised without the Supabase CLI:
--   * roles anon, authenticated (NOLOGIN) and service_role (BYPASSRLS)
--   * schema auth with auth.users and auth.uid() (reads the JWT claims GUC the
--     same way Supabase's auth.uid() does)
--   * Supabase's default privileges in schema public (ALL on tables, functions
--     and sequences to anon/authenticated/service_role) — this is what makes the
--     0009 hardening necessary, so the harness must reproduce it.
--
-- Run as a superuser on an EMPTY database, before the migrations.

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'auth') then
    raise exception 'auth schema already exists — this shim is only for an empty local test database, never for Supabase';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id    uuid primary key,
  email text unique
);

-- Same resolution order as Supabase's auth.uid().
create function auth.uid() returns uuid
  language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- Supabase's default privileges in public.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
