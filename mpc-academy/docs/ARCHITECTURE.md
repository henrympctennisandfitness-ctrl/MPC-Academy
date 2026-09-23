# Architecture

## Purpose of Phase 1

Phase 1 lays a **foundation** without changing runtime behaviour. The existing
member and coach UI runs exactly as before, on the seed/legacy data path. In
parallel we introduce a database schema, a security model (RLS), an entitlement
engine, a submission state machine, and a **repository seam** that a later phase
can switch onto Supabase with minimal churn.

## System roles (target V2)

| Concern | Authority |
|--------|-----------|
| Membership & payment | **Squarespace** (Phase 2) |
| Application ownership identity | **MPC internal UUID** (`app_users.id`) |
| Application state | **Supabase / Postgres** |
| Private video infrastructure | **Cloudflare Stream** (Phase 3) |
| Operational coaching interface | **Coach Studio** (existing UI) |

Squarespace authenticates and authorises *membership*; it never becomes a
foreign key. The internal UUID is the only thing that grants ownership, so the
external identity mechanism can change without touching submissions, reviews,
entitlements, or future messaging/bookings (decision C).

## The repository seam (decision B)

```
              ┌────────────────────────┐
  live UI ──► │ Repository interface    │
              │ (SubmissionsRepository, │
              │  MembersRepository,     │
              │  EntitlementsRepository)│
              └───────────┬─────────────┘
                          │
        ┌─────────────────┴───────────────────┐
        ▼                                      ▼
  Seed impl (client-safe)             Supabase impl (server-only)
  DEV_* fixtures                      RLS-governed / atomic SQL RPCs
  used by the app now                 verified against a live DB
```

Both sides implement the same interface. The app depends on the interface, not
on Supabase, so **no live Supabase project is needed to run locally**. Server
code can construct the Supabase implementation when it is ready.

### Client-safe vs server-only

Barrels (`src/services/*/index.ts` and `src/services/index.ts`) export only
client-safe modules: domain types, pure logic, and seed repositories. The
server-only modules are imported directly from their files, never via a barrel:

- `src/services/database/supabaseClient.ts` — client factories (service-role path)
- `src/services/submissions/supabase.repository.ts`
- `src/services/entitlements/supabase.repository.ts`

This keeps the service-role key and RLS-bypass paths out of any client bundle.

## Service layer map

```
src/services/
  identity/     roles + principal helpers (mirror DB roles; DB is authority)
  members/      Member domain, seed repository (app_users + roles + access view)
  submissions/  types, state machine, mappers, Zod validation, seed + supabase repos
  reviews/      coach review domain types (authoring built in Phase 3)
  entitlements/ period keys (Europe/London), pure model, repo interface + supabase impl
  database/     env accessors, Supabase client factories, dev fixtures
```

## Data flow (target, once switched on)

1. A verified session (Phase 2) resolves the member's internal UUID and sets the
   `app.current_member_id` GUC on the request's DB connection.
2. RLS uses that GUC (`current_app_user_id()`) to scope every row to its owner;
   coaches/admins are scoped by role.
3. Members create submissions; entitlement consumption is atomic in the DB.
4. Coaches/admins drive workflow transitions through `transition_submission()`.
5. Video is represented provider-agnostically (`video_assets`), ready for
   Cloudflare Stream in Phase 3 while legacy Google submissions stay representable.

## How future phases attach (no premature tables — decision A)

Phase 4–6 tables (messaging, bookings, notifications, content, challenges,
library) are **not** created now. The architecture accommodates them by:

- keeping identity/ownership on the internal UUID they will all reference;
- keeping the repository seam, so each feature adds its own repository + Supabase
  implementation behind an interface;
- keeping RLS as the enforcement layer, so new tables add policies in the same
  ownership/role pattern.

See `docs/PHASES.md` for the roadmap and acceptance criteria.
