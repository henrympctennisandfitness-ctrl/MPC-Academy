# Privacy & Retention

## Guiding rule (decision 6)

Retention periods are **not set** in Phase 1. We do **not** invent legal
retention periods. MPC will define and approve them before production. Every
retention value in the schema and environment is a deliberate placeholder.

## What Phase 1 puts in place

- **`data_retention_policies`** (migration 0005): one row per `data_class`
  (`VIDEO`, `FEEDBACK`, `SUBMISSION`, `TECH_LOG`, `INACTIVE_MEMBER`). For every
  row, `retention_days` is **NULL** and `approved = false`, with a note that the
  value is pending MPC approval. Nothing reads these to delete data.
- **`deletion_requests`** (migration 0005): a place to *record* a data-subject or
  admin deletion request. There is **no destructive automation** — recording a
  request does not delete anything in Phase 1.
- **`audit_events`** (migration 0005): accountability log for sensitive actions
  (who did what, to which subject). Supports future privacy accountability.
- **Env placeholders** (`.env.example`): `VIDEO_RETENTION_DAYS`,
  `FEEDBACK_RETENTION_DAYS`, `SUBMISSION_RETENTION_DAYS`, `TECH_LOG_RETENTION_DAYS`,
  `INACTIVE_MEMBER_RETENTION_DAYS` — all **blank**.

## Personal data posture in Phase 1 (decision 5)

- **No real member data.** Seed identities are clearly fictional (`*(dev)` display
  names, `contact_email` null). `docs`/fixtures/`seed.sql` all use fake UUIDs.
- Identity is the internal UUID; email/name are **not** identity (decision C), so
  the system does not depend on storing personal contact details to function.

## Data classes and where they live

| Class | Location (target) | Notes |
|-------|-------------------|-------|
| VIDEO | `video_assets` → Cloudflare Stream (Phase 3) | Private playback; no permanent public URL as design. Legacy Drive links are a documented exception being retired. |
| FEEDBACK | `coach_reviews`, `review_annotations` | Coaching output tied to a submission. |
| SUBMISSION | `submissions` | Request metadata + status. |
| TECH_LOG | `audit_events` (+ platform logs) | Keep free of secrets/personal data. |
| INACTIVE_MEMBER | `app_users` / `member_access` | Handling defined when MPC sets retention. |

## Before production (MPC to complete)

1. Decide a retention period (or explicit “retain indefinitely with review”) for
   each `data_class`, and set `approved = true` with the agreed `retention_days`.
2. Decide whether deletion is automated or manual, and implement it **only** once
   periods are approved. Deletion automation is intentionally absent now.
3. Confirm the lawful basis and any data-subject request workflow (the
   `deletion_requests` table is the intake point).

Nothing in Phase 1 should be read as legal advice or as an approved retention
schedule.
