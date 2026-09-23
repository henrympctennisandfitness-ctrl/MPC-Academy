-- 0004_entitlements.sql
-- Monthly analysis entitlement. Atomic, server-side, configurable, idempotent.
-- Period keys (first-of-month, Europe/London) are computed app-side (see period.ts)
-- and passed in, so month boundaries honour the authoritative timezone.

create table entitlement_plans (
  code        text primary key,   -- 'TRIAL_1_MONTH' | 'PLAN_2_MONTH' | 'UNLIMITED'
  per_period  integer,            -- NULL = unlimited
  description text not null default ''
);
insert into entitlement_plans(code, per_period, description) values
  ('TRIAL_1_MONTH', 1,    'Trial: 1 analysis per calendar month'),
  ('PLAN_2_MONTH',  2,    '2 analyses per calendar month'),
  ('UNLIMITED',     null, 'Unlimited analyses')
on conflict (code) do nothing;

create table monthly_entitlements (
  member_id  uuid not null references app_users(id) on delete cascade,
  period     date not null,                    -- first of month (Europe/London)
  plan_code  text not null references entitlement_plans(code) default 'TRIAL_1_MONTH',
  allowance  integer not null default 1,       -- effective allowance (base + grants)
  used       integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (member_id, period),
  constraint used_non_negative      check (used >= 0),
  constraint used_within_allowance  check (used <= allowance)
);
create trigger monthly_entitlements_set_updated before update on monthly_entitlements
  for each row execute function set_updated_at();

-- Bonus / manual grants ledger (audited).
create table entitlement_grants (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references app_users(id) on delete cascade,
  period     date not null,
  amount     integer not null check (amount <> 0),
  reason     text not null default '',
  granted_by uuid references app_users(id),
  created_at timestamptz not null default now()
);
create index entitlement_grants_member_idx on entitlement_grants(member_id, period);

-- Ensure a monthly_entitlements row exists for (member, period) from their plan.
-- UNLIMITED is represented as a very large allowance to keep the atomic guard simple.
create or replace function ensure_entitlement(p_member uuid, p_period date, p_plan text default 'TRIAL_1_MONTH')
returns monthly_entitlements
language plpgsql security definer set search_path = public as $$
declare row monthly_entitlements; base integer;
begin
  select per_period into base from entitlement_plans where code = p_plan;
  insert into monthly_entitlements(member_id, period, plan_code, allowance, used)
    values (p_member, p_period, p_plan, coalesce(base, 2147483647), 0)
    on conflict (member_id, period) do nothing;
  select * into row from monthly_entitlements where member_id = p_member and period = p_period;
  return row;
end $$;

-- Atomically claim ONE unit for a submission. Idempotent per submission
-- (duplicate browser requests cannot double-consume). Returns true if held.
create or replace function claim_entitlement(p_member uuid, p_period date, p_submission uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare already boolean; updated integer;
begin
  perform ensure_entitlement(p_member, p_period);

  select (consumed_at is not null and consumption_released_at is null)
    into already from submissions where id = p_submission;
  if already then return true; end if;   -- idempotent: this submission already holds a unit

  update monthly_entitlements
    set used = used + 1
    where member_id = p_member and period = p_period and used < allowance;
  get diagnostics updated = row_count;
  if updated = 0 then return false; end if;   -- allowance exhausted

  update submissions
    set period = p_period, consumed_at = now(), consumption_released_at = null
    where id = p_submission;
  return true;
end $$;

-- Release a previously-held unit (upload fail, cancel before submit, processing
-- fail, admin void). Idempotent per submission. An abandoned upload therefore
-- never permanently consumes the monthly allowance.
create or replace function release_entitlement(p_submission uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare m uuid; per date; consumed timestamptz; released timestamptz;
begin
  select member_id, period, consumed_at, consumption_released_at
    into m, per, consumed, released
    from submissions where id = p_submission for update;
  if consumed is null or released is not null then return false; end if;

  update monthly_entitlements set used = greatest(used - 1, 0)
    where member_id = m and period = per;
  update submissions set consumption_released_at = now() where id = p_submission;
  return true;
end $$;

-- Apply a bonus grant (raises allowance), audited via entitlement_grants.
create or replace function grant_entitlement(p_member uuid, p_period date, p_amount integer, p_reason text, p_by uuid)
returns monthly_entitlements
language plpgsql security definer set search_path = public as $$
declare row monthly_entitlements;
begin
  perform ensure_entitlement(p_member, p_period);
  insert into entitlement_grants(member_id, period, amount, reason, granted_by)
    values (p_member, p_period, p_amount, p_reason, p_by);
  update monthly_entitlements set allowance = allowance + p_amount
    where member_id = p_member and period = p_period returning * into row;
  return row;
end $$;
