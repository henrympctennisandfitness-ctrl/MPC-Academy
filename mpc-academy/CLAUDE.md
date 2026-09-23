# CLAUDE.md — MPC Academy V2 governance

Read this before making changes. It records the V2 architecture, the current
phase status, and the rules that constrain work in this repo.

## What this project is

MPC Academy — a premium tennis-coaching membership web app (Next.js 15 App
Router, React 19, TypeScript, Tailwind). It is migrating from a prototype to a
governed V2 across six phases.

## Fixed architecture

| Layer | Authority |
|-------|-----------|
| Squarespace | Membership / payment authority (Phase 2) |
| MPC internal UUID (`app_users.id`) | Application ownership identity |
| Supabase / Postgres | Application state |
| Cloudflare Stream | Private video infrastructure (Phase 3) |
| Coach Studio | Operational coaching interface |

Identity is **auth-provider agnostic**: `app_users.id` is our own UUID, never a
Supabase Auth id, email, name, or Squarespace customer id. The external identity
mechanism can change without rewriting submissions/reviews/entitlements/future
features.

## Phase status

- **Phase 1 — Foundation: COMPLETE (this repo).** Schema, RLS, entitlements,
  state machine, provider-abstracted video metadata, repository seam, security
  audit, docs. The **live UI is unchanged** and does not require Supabase.
- Phases 2–6: not started. See `docs/PHASES.md`.

## Rules (do not violate without explicit approval)

1. **No premature tables.** Do not create Phase 4–6 tables (messaging, bookings,
   notifications, content, challenges, library) until their phase.
2. **Do not switch the live UI to Supabase yet.** Keep the repository seam:
   UI → interface → seed impl (now); interface → Supabase impl (separately).
   The app must run with no live Supabase project.
3. **RLS is mandatory.** Enabled on every table, never disabled as a workaround,
   no production bypass. Service-role key is server-only, never in the browser,
   never `NEXT_PUBLIC_`.
4. **Entitlements are enforced in the database** (atomic `used < allowance`).
   Frontend checks are advisory only. Consume/restore rules are documented in
   `docs/DATABASE.md`; an abandoned upload must never permanently consume a unit.
5. **State machine is enforced.** Members can never set `IN_REVIEW`/`COMPLETED`.
   Transitions go through `transition_submission()`.
6. **Video is provider-abstracted.** No Google-Drive-specific design; no
   permanent public playback URLs as the long-term design.
7. **Retention stays unset.** No invented legal retention periods; placeholders
   only until MPC approves (`docs/PRIVACY-RETENTION.md`).
8. **Legacy Google is frozen.** Leave it functioning; do not expand or delete it.
   Security limitations are documented in `docs/SECURITY.md`.
9. **No real member data.** Fictional seed identities only in Phase 1.
10. **Approved folders for foundation work:** `supabase/`, `src/services/`, `docs/`.
11. **Secrets:** never print secret values; if rotation is needed, name the
    credential *type*, not the value.

## Where things live

```
supabase/         migrations (0001–0006), seed.sql, config.toml, README.md
src/services/     repository seam (identity, members, submissions, reviews,
                  entitlements, database) — client-safe barrels; server-only
                  modules imported directly (never via barrel)
docs/             ARCHITECTURE, DATABASE, SECURITY, PRIVACY-RETENTION,
                  MIGRATION, PHASES
```

Client-safe vs server-only: barrels never re-export the Supabase client factory
or the Supabase repositories. Import those directly in server code.

## Environment

See `.env.example`. Categories: PUBLIC (`NEXT_PUBLIC_SUPABASE_*`), SERVER-ONLY
(`SUPABASE_SERVICE_ROLE_KEY`), RETENTION placeholders (blank), LEGACY
(`NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL`). The app runs with none of them set.

## Commands

```
npm run dev         # run the app (seed data path)
npm run type-check  # tsc --noEmit
npm run lint        # next lint
npm run build       # next build
npm run test        # vitest run (pure unit tests; no DB/network)
```

RLS and the Supabase repositories require a live database and are verified
separately — they are not part of the Vitest suite.
