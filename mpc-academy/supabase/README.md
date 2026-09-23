# Supabase (Phase 1 Foundation)

This directory holds the database foundation for MPC Academy V2. **Nothing here
is wired into the live app yet** (decision B): the running UI still uses the
seed repositories. This is the migration seam only.

## Layout

```
supabase/
  config.toml          Local project config (no secrets)
  migrations/          Ordered SQL migrations (0001 → 0006)
  seed.sql             Fictional dev identities + submissions (decision 5)
  README.md            This file
```

## Migrations

| File | Contents |
|------|----------|
| `0001_init_extensions_enums.sql` | `pgcrypto`; enums for roles, submission status, video provider, data class |
| `0002_identity_roles.sql` | `app_users`, `member_access`, `user_roles`; identity resolvers (`current_app_user_id`, `has_role`) |
| `0003_submissions_reviews_video.sql` | `submissions`, `video_assets`, `coach_reviews`, `review_annotations`; `transition_submission()` |
| `0004_entitlements.sql` | `entitlement_plans`, `monthly_entitlements`, `entitlement_grants`; `ensure/claim/release/grant` functions |
| `0005_privacy_retention_audit.sql` | `data_retention_policies` (placeholders), `deletion_requests`, `audit_events` |
| `0006_rls_policies.sql` | Enables RLS on all 12 tables and defines every policy |

Migrations are plain SQL and apply in filename order.

## Applying (manual — do this yourself; see `docs/MIGRATION.md`)

The app does **not** need a live project to run. To stand one up for testing:

1. Create a Supabase project (region close to Europe/London).
2. Apply migrations in order, e.g. with the Supabase CLI:
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push        # applies supabase/migrations in order
   ```
   or paste each migration into the SQL editor in numeric order.
3. (Optional, dev only) run `seed.sql` for fictional identities.
4. Put the project URL + anon key in `.env.local` as the `NEXT_PUBLIC_SUPABASE_*`
   vars, and the service-role key as `SUPABASE_SERVICE_ROLE_KEY` (server-only —
   never `NEXT_PUBLIC_`).

## Identity note (decision C)

`app_users.id` is our own internal UUID. It is **not** a Supabase Auth id, an
email, or a Squarespace customer id. Phase 2 decides how a verified Squarespace
membership maps onto that UUID by setting the `app.current_member_id` GUC per
request. Until then, member-ownership RLS policies deny by default.

## RLS note (decision D)

RLS is enabled on every table and is **never** disabled as a workaround. Policies
that depend on the Phase-2 identity resolver are marked in `0006` and in
`docs/DATABASE.md`. The service-role key bypasses RLS and is server-only.
