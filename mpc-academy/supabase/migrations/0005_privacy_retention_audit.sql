-- 0005_privacy_retention_audit.sql
-- Privacy-by-design foundations. NO real/legal retention periods are invented here.
-- retention_days stays NULL and approved=false until MPC signs off (docs/PRIVACY-RETENTION.md).
-- NO destructive automated deletion is implemented in Phase 1.

create table data_retention_policies (
  data_class     data_class primary key,
  retention_days integer,                 -- NULL = not set (pending MPC approval)
  approved       boolean not null default false,
  notes          text not null default 'Pending MPC approval',
  updated_at     timestamptz not null default now()
);
create trigger drp_set_updated before update on data_retention_policies
  for each row execute function set_updated_at();

insert into data_retention_policies(data_class) values
  ('VIDEO'), ('FEEDBACK'), ('SUBMISSION'), ('TECH_LOG'), ('INACTIVE_MEMBER')
on conflict (data_class) do nothing;

-- Data-subject / deletion requests. Recorded now; processing designed, not automated.
create table deletion_requests (
  id                uuid primary key default gen_random_uuid(),
  subject_member_id uuid references app_users(id) on delete set null,
  request_type      text not null,        -- EXPORT | VIDEO_DELETE | SUBMISSION_DELETE | ACCOUNT_DELETE
  status            text not null default 'RECEIVED',  -- RECEIVED|APPROVED|PROCESSED|REJECTED
  requested_at      timestamptz not null default now(),
  processed_at      timestamptz,
  notes             text not null default ''
);
create index deletion_requests_subject_idx on deletion_requests(subject_member_id);

-- Security/accountability audit trail (role changes, admin actions, deletions).
create table audit_events (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references app_users(id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  uuid,
  metadata   jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_events_entity_idx on audit_events(entity, entity_id);
