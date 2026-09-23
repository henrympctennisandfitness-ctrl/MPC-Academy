# Migration

How the foundation gets applied, and how the app switches onto it later. Phase 1
does **not** switch the live UI (decision B) and does **not** migrate real member
data (decision J).

## Applying the schema (manual)

The app runs without a live Supabase project. To create one for testing:

1. Create a Supabase project (region near Europe/London).
2. Apply `supabase/migrations/*` in filename order (0001 → 0006), via
   `supabase db push` or the SQL editor.
3. (Dev only) run `supabase/seed.sql` for fictional identities.
4. Configure env:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never `NEXT_PUBLIC_`)

See `supabase/README.md` for commands.

## The repository seam

The live UI depends on repository **interfaces**, satisfied today by seed
implementations:

- `SeedSubmissionsRepository`, `SeedMembersRepository`, `InMemoryEntitlementLedger`.

Supabase implementations already exist behind the same interfaces:

- `SupabaseSubmissionsRepository`, `SupabaseEntitlementsRepository` (server-only).

Switching a feature onto Supabase later means constructing the Supabase
implementation in server code and passing it where the interface is expected —
no interface changes required.

## Switch-on sequence (future phases — not done now)

1. **Phase 2** resolves verified identity → sets `app.current_member_id` GUC per
   request so RLS attributes rows to the internal UUID.
2. Point the read paths (member submissions, coach queue, members roster) at the
   Supabase repositories on the server, keeping the seam.
3. Move writes (create submission, transitions, entitlement claim/release) onto
   the SQL functions, which are atomic and RLS/role-enforced.
4. Only then retire the corresponding seed path.

## Legacy Google (decision 7)

- Left **functioning** during Phase 1. **Not expanded. Not deleted.**
- `video_assets.provider = GOOGLE_DRIVE_LEGACY` keeps legacy submissions
  representable alongside future Cloudflare assets.
- Retirement happens across the V2 phases; security limitations are documented in
  `docs/SECURITY.md`.

## Data migration

Not part of Phase 1. No real member data is moved. When it happens, it maps
legacy records onto internal UUIDs and provider-abstracted `video_assets`, under
an approved retention policy (`docs/PRIVACY-RETENTION.md`).
