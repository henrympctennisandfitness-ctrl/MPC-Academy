-- 0002_identity_roles.sql
-- Internal application identity + roles. Auth-provider agnostic.
-- app_users.id is our OWN internal UUID — never a Supabase Auth id, email, or name.
-- Phase 2 will map a verified Squarespace membership to app_users via member_access.

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- Internal identity. NOT a customer-profile copy. PII is minimised.
create table app_users (
  id            uuid primary key default gen_random_uuid(),
  status        text not null default 'active',
  -- contact_email: OPTIONAL, notification-only, retention-governed.
  -- Phase 1 stores fictional seed emails ONLY. Real emails deferred to Phase 2.
  contact_email text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger app_users_set_updated before update on app_users
  for each row execute function set_updated_at();

-- Membership/access foundation. external_ref is an OPAQUE pointer to the Phase 2
-- identity source — never an email, name, or Squarespace customer record.
create table member_access (
  app_user_id  uuid primary key references app_users(id) on delete cascade,
  is_active    boolean not null default false,
  external_ref text,
  verified_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger member_access_set_updated before update on member_access
  for each row execute function set_updated_at();

-- Role assignments (many-to-many). Coaches/admins are assigned by ROLE via seed,
-- so Henry/Calum are NEVER hard-coded into policies.
create table user_roles (
  app_user_id uuid not null references app_users(id) on delete cascade,
  role        app_role not null,
  created_at  timestamptz not null default now(),
  primary key (app_user_id, role)
);
create index user_roles_role_idx on user_roles(role);

-- ---- Identity resolvers -----------------------------------------------------
-- current_app_user_id() reads a GUC that a VERIFIED session will set in Phase 2.
-- Until then it returns NULL, so member-ownership policies deny by default
-- (a safe posture — NOT a bypass). Dev/tests set it via set_config('app.current_member_id', ...).
create or replace function current_app_user_id() returns uuid
  language sql stable as $$
  select nullif(current_setting('app.current_member_id', true), '')::uuid
$$;

create or replace function has_role(uid uuid, r app_role) returns boolean
  language sql stable as $$
  select exists (select 1 from user_roles ur where ur.app_user_id = uid and ur.role = r)
$$;

create or replace function current_user_has_role(r app_role) returns boolean
  language sql stable as $$
  select has_role(current_app_user_id(), r)
$$;
