# Database

Postgres (Supabase-hosted). Migrations live in `supabase/migrations/`, applied
in filename order. The schema is intentionally **minimal** (decision A): only the
tables Phase 1 genuinely needs. Phase 4–6 tables are deferred to their phases.

## Enums (0001)

- `app_role`: `MEMBER | COACH | ADMIN`
- `submission_status`: `DRAFT | UPLOADING | PROCESSING | SUBMITTED | IN_REVIEW | COMPLETED | FAILED | CANCELLED`
- `video_provider`: `GOOGLE_DRIVE_LEGACY | CLOUDFLARE_STREAM`
- `data_class`: `VIDEO | FEEDBACK | SUBMISSION | TECH_LOG | INACTIVE_MEMBER`

## Tables

### Identity & access (0002)
- **app_users** — `id uuid pk` (our internal identity, `gen_random_uuid()`),
  `status`, optional `contact_email` (fictional-only in Phase 1). This id is the
  ownership key everywhere. It is **not** a Supabase Auth id/email/name (decision C).
- **member_access** — membership/access foundation. Holds an opaque
  `external_ref` (no Squarespace details as FKs), `is_active`, `verified_at`.
  Phase 2 populates/verifies this.
- **user_roles** — many-to-many `app_user_id → app_role`.

Resolvers (SQL): `current_app_user_id()` reads the `app.current_member_id` GUC
(NULL until Phase 2 → deny by default); `has_role()` / `current_user_has_role()`.

### Submissions & video (0003)
- **submissions** — `member_id` (owner UUID), `status`, `analysis_type`, `goal`,
  `notes`, `assigned_coach_id`, `period date` (entitlement month), `consumed_at`,
  `consumption_released_at`. Indexed by member, status, and coach queue.
- **video_assets** — provider-abstracted (decision G): `provider`, `external_id`,
  `playback_ref`, `legacy_public_url` (Google-only; a documented limitation, not
  the long-term design), `status`. No permanent public URL is the design intent.
- **coach_reviews** — `submission_id`, `coach_id`, `feedback`, `coach_notes`,
  `completed_at`.
- **review_annotations** — `review_id`, optional `t_ms` (video timestamp), `body`.

### Entitlements (0004)
- **entitlement_plans** — `TRIAL_1_MONTH` (1), `PLAN_2_MONTH` (2), `UNLIMITED`
  (`per_period` NULL). Supports 1/month, 2/month, unlimited, plus grants (decision E).
- **monthly_entitlements** — pk `(member_id, period)`, `plan_code`, `allowance`,
  `used`. Check constraints: `used >= 0` and `used <= allowance`.
- **entitlement_grants** — audit ledger of manual bonus grants.

### Privacy / retention / audit (0005)
- **data_retention_policies** — one row per `data_class`. `retention_days` is
  **NULL** and `approved = false` for all classes (decision 6 — MPC approves later).
  No automation deletes anything.
- **deletion_requests** — records a request; no destructive automation in Phase 1.
- **audit_events** — accountability log (actor, action, subject, metadata).

## Submission state machine (0003 + app mirror)

`transition_submission(p_id, p_to, p_actor)` is SECURITY DEFINER and enforces the
allowed transitions below. The app mirror lives in
`src/services/submissions/stateMachine.ts` for UI/tests, but **the database is
authoritative**. Members can **never** reach `IN_REVIEW` or `COMPLETED`.

| From | To | Allowed actors |
|------|----|----------------|
| DRAFT | UPLOADING | MEMBER, SYSTEM, ADMIN |
| DRAFT | CANCELLED | MEMBER, ADMIN |
| UPLOADING | PROCESSING | SYSTEM, ADMIN |
| UPLOADING | SUBMITTED | SYSTEM, ADMIN |
| UPLOADING | FAILED | SYSTEM, ADMIN |
| UPLOADING | CANCELLED | MEMBER, ADMIN |
| PROCESSING | SUBMITTED | SYSTEM, ADMIN |
| PROCESSING | FAILED | SYSTEM, ADMIN |
| PROCESSING | CANCELLED | ADMIN |
| SUBMITTED | IN_REVIEW | COACH, ADMIN |
| SUBMITTED | CANCELLED | ADMIN |
| IN_REVIEW | COMPLETED | COACH, ADMIN |
| IN_REVIEW | SUBMITTED | COACH, ADMIN |
| IN_REVIEW | CANCELLED | ADMIN |
| COMPLETED / FAILED / CANCELLED | — | terminal |

`SYSTEM` = server-driven steps (post-upload/processing), executed with ADMIN
authority via the service role. This is the path Phase 3 (Cloudflare) uses for
`UPLOADING → PROCESSING → SUBMITTED` and failure paths.

## Entitlement consumption & restoration (decision E)

A monthly unit is **consumed** and **restored** by atomic SQL functions so
concurrent requests cannot overspend. The atomic guard is:

```sql
update monthly_entitlements set used = used + 1
  where member_id = ? and period = ? and used < allowance;
```

If zero rows update, the allowance is exhausted and the claim fails. Idempotency
is tracked on the submission via `consumed_at` / `consumption_released_at`.

**When a unit is CONSUMED**
- When a submission first **claims** it (at upload creation / start of the real
  create flow). `claim_entitlement(member, period, submission)` is idempotent per
  submission id, so duplicate browser requests cannot double-consume.

**When a unit is RESTORED**
- The submission moves to `FAILED` or `CANCELLED`
  (`RELEASE_ENTITLEMENT_ON = [FAILED, CANCELLED]`).
- `release_entitlement(submission)` is idempotent — releasing twice is a no-op.

### Documented edge cases

| Case | Rule |
|------|------|
| Upload fails before completion | Submission → `FAILED` (or `CANCELLED`); unit **released**. Never permanently consumed. |
| Member cancels before submission | Submission → `CANCELLED`; unit **released**. |
| Cloudflare processing fails (Phase 3) | `PROCESSING → FAILED` by SYSTEM; unit **released**. |
| Coach/admin voids a submission | Admin → `CANCELLED`; unit **released**. |
| Duplicate browser requests | `claim` is idempotent per submission id → at most one unit consumed. |
| Abandoned upload (no terminal state) | Holds one unit *only* if it claimed one; the create flow claims at upload start and any failure/cancel path releases it, so an abandoned upload that reaches a failure/cancel state is restored. Operationally, stale `UPLOADING`/`DRAFT` rows should be swept to `CANCELLED` (Phase 3 concern) to release held units. **An abandoned upload must not permanently consume the allowance.** |

`UNLIMITED` is represented by a very large allowance (`2147483647`) so the same
`used < allowance` path works without special-casing.

## RLS summary

RLS is enabled on **all 12 tables** (0006). See `docs/SECURITY.md` for the policy
model and Phase-2 dependency. RLS is never disabled; there is no production bypass.

## Testing note

Phase 1 tests are pure unit tests (state machine, entitlement model, period keys,
mappers, validation, roles). **RLS and the SQL functions require a live database**
and are verified separately against a real Supabase project — they are not part
of the Vitest suite here.
