-- 0003_submissions_reviews_video.sql
-- Submissions, provider-abstracted video metadata, coach reviews, annotations,
-- and the server-side transition guard.

create table submissions (
  id                      uuid primary key default gen_random_uuid(),
  member_id               uuid not null references app_users(id) on delete cascade,
  status                  submission_status not null default 'DRAFT',
  analysis_type           text not null,
  goal                    text not null,
  notes                   text not null default '',
  assigned_coach_id       uuid references app_users(id),
  -- calendar-month entitlement period (first of month, Europe/London); set at claim time.
  period                  date,
  -- entitlement consumption tracking (idempotent restore — see docs/DATABASE.md).
  consumed_at             timestamptz,
  consumption_released_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create trigger submissions_set_updated before update on submissions
  for each row execute function set_updated_at();
create index submissions_member_idx      on submissions(member_id, period);
create index submissions_status_idx      on submissions(status);
create index submissions_coach_queue_idx on submissions(assigned_coach_id, status);

-- Provider-abstracted video metadata. NOT Drive-specific. No names/emails in paths.
create table video_assets (
  id                uuid primary key default gen_random_uuid(),
  submission_id     uuid not null references submissions(id) on delete cascade,
  provider          video_provider not null,
  external_id       text,          -- Cloudflare uid (Phase 3) OR legacy Drive file id
  playback_ref      text,          -- how a (preferably private/signed) playback is obtained later
  legacy_public_url text,          -- ONLY for GOOGLE_DRIVE_LEGACY rows; a documented security limitation
  status            text not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger video_assets_set_updated before update on video_assets
  for each row execute function set_updated_at();
create index video_assets_submission_idx on video_assets(submission_id);

create table coach_reviews (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  coach_id      uuid not null references app_users(id),
  feedback      text,
  coach_notes   text,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger coach_reviews_set_updated before update on coach_reviews
  for each row execute function set_updated_at();
create index coach_reviews_submission_idx on coach_reviews(submission_id);

-- Annotations retained (justified): Phase 3 timestamped coaching notes on a clip.
create table review_annotations (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references coach_reviews(id) on delete cascade,
  t_ms       integer,             -- optional video timestamp
  body       text not null,
  created_at timestamptz not null default now()
);
create index review_annotations_review_idx on review_annotations(review_id);

-- Submission transition guard. Members may NEVER set IN_REVIEW/COMPLETED.
-- Server/system-driven steps run with ADMIN authority (service role). Mirrors stateMachine.ts.
create or replace function transition_submission(p_id uuid, p_to submission_status, p_actor app_role)
returns submissions
language plpgsql security definer set search_path = public as $$
declare cur submissions; ok boolean;
begin
  select * into cur from submissions where id = p_id for update;
  if not found then raise exception 'submission % not found', p_id; end if;

  ok := case
    when cur.status = 'DRAFT'      and p_to = 'UPLOADING'  and p_actor in ('MEMBER','ADMIN') then true
    when cur.status = 'DRAFT'      and p_to = 'CANCELLED'  and p_actor in ('MEMBER','ADMIN') then true
    when cur.status = 'UPLOADING'  and p_to = 'PROCESSING' and p_actor = 'ADMIN'             then true
    when cur.status = 'UPLOADING'  and p_to = 'SUBMITTED'  and p_actor = 'ADMIN'             then true
    when cur.status = 'UPLOADING'  and p_to = 'FAILED'     and p_actor = 'ADMIN'             then true
    when cur.status = 'UPLOADING'  and p_to = 'CANCELLED'  and p_actor in ('MEMBER','ADMIN') then true
    when cur.status = 'PROCESSING' and p_to = 'SUBMITTED'  and p_actor = 'ADMIN'             then true
    when cur.status = 'PROCESSING' and p_to = 'FAILED'     and p_actor = 'ADMIN'             then true
    when cur.status = 'SUBMITTED'  and p_to = 'IN_REVIEW'  and p_actor in ('COACH','ADMIN')  then true
    when cur.status = 'IN_REVIEW'  and p_to = 'COMPLETED'  and p_actor in ('COACH','ADMIN')  then true
    when cur.status = 'IN_REVIEW'  and p_to = 'SUBMITTED'  and p_actor in ('COACH','ADMIN')  then true
    when p_to = 'CANCELLED'        and p_actor = 'ADMIN'                                     then true
    else false
  end;

  if not ok then
    raise exception 'illegal submission transition % -> % by %', cur.status, p_to, p_actor;
  end if;

  update submissions set status = p_to where id = p_id returning * into cur;
  return cur;
end $$;
