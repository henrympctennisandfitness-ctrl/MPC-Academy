# Phase 2B — Authentication, Identity Mapping & Entitlement Enforcement

Status (10 Nov 2026): **database security applied to the DEVELOPMENT database
only. Not deployed to production. Authentication integration is not complete.**

> Migrations `0001`–`0011` have been applied to the Supabase **development**
> database (project "MPC Academy", West EU / Ireland), and the revised Phase 2B RLS
> integration test (`supabase/tests/phase2b_rls_roles.test.sql`) passed there, as
> reported by the user who ran them. No production database has been changed. The
> auth application code is implemented locally, and sign-in has not been verified
> end to end.

Enforcement of authentication is behind a server-side feature flag and is
**disabled by default** — the live app, mock identities and Google workflows are
unchanged until it is switched on.

## Architecture

MPC Academy authenticates with **Supabase Auth** (passwordless email magic link).
Authorization is a chain, and **authentication is not entitlement**:

```
Supabase auth.users.id
   -> app_users.auth_user_id  (mapping added in 0007)
   -> app_users.id            (internal MPC UUID — the ownership key, unchanged)
   -> member_access           (active + time window = Academy entitlement)
   -> user_roles              (MEMBER / COACH / ADMIN)
   -> Postgres RLS            (derives identity from auth.uid())
```

A user reaches member data only with BOTH a resolved internal identity AND an
active entitlement. Roles then decide the coach area. Every missing/ambiguous
state fails closed.

## Migrations (apply in order, one at a time)

| File | Purpose |
|------|---------|
| `0001`–`0006` | Phase 1 foundation (committed) — enums, identity/roles, submissions/reviews/video, entitlements, privacy/audit, RLS |
| `0007_phase2b_auth_identity_entitlement.sql` | `app_users.auth_user_id`; `member_access` window columns; JWT-based resolvers; `current_access_snapshot()` |
| `0008_phase2b_rls_transition.sql` | Member data policies require an ACTIVE entitlement |
| `0009_security_hardening.sql` | Explicit function EXECUTE model; mutation functions service_role-only; default privileges revoked |
| `0010_fix_role_rls_recursion.sql` | Non-re-entrant role check; empty `search_path` on the identity chain; `has_role()` server-only; no browser writes to roles/entitlements |
| `0011_explicit_privileges_private_notes.sql` | Applied to the development database only. Explicit table privileges; private coach notes table; published feedback; unsafe write policies removed; RLS on `entitlement_plans` |

Never edit `0001`–`0009`. Fixes go in new numbered migrations.
`phase2-migrations-review.txt` is an older concatenation that stops at `0008` —
do **not** paste from it; paste from the individual migration files.

### 0010 — why role checks were changed

Every role-gated policy calls `current_user_has_role(r)`. Before 0010 it was a
SECURITY INVOKER function delegating to `has_role(uid, r)`, which reads
`user_roles` under RLS — and `user_roles`' own policy calls
`current_user_has_role('ADMIN')`. Every role check therefore re-entered the
`user_roles` policy. On a local PostgreSQL 16 harness this **did not** produce an
infinite-recursion error: it terminates because the planner applies the leakproof
`app_user_id = …` filter before the RLS qual and the first `OR` branch then
short-circuits. That ordering is not guaranteed, so the design was latent rather
than broken. 0010 removes the re-entry by construction:

- `current_user_has_role(r)` is `SECURITY DEFINER`, `set search_path = ''`, and
  looks up only the **caller** (`current_app_user_id()` → `auth.uid()`). It takes
  no member id, so it cannot be used to probe other people.
- `has_role(uid, r)` (arbitrary uid) is no longer used by policies and is
  revoked from `anon`/`authenticated` (service_role keeps it).
- The 0007 resolvers are re-declared with `search_path = ''` and qualified names.
- `anon`/`authenticated` lose INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER on
  `user_roles` and `member_access` (RLS already denied writes; TRUNCATE is not
  covered by RLS). SELECT remains, filtered by the unchanged policies.
- No policy is dropped, altered or added.

## Trust boundaries

- **Browser**: holds only the Supabase session cookie (publishable key is public).
  It cannot set identity — identity comes only from the verified JWT via
  `auth.uid()`. The enforcement flag is never read from the client.
- **Server (SSR / middleware)**: server client carries the session cookie; RLS applies.
- **Service role (secret key)**: server-only, used solely by provisioning; never
  `NEXT_PUBLIC_`, never imported by client code (`import "server-only"` guards).

## Squarespace's role

Commercial membership/payment authority only. It is **not** in the runtime auth
path (Phase 2A proved the supported APIs can't confirm active membership).
Reconciliation is **manual/administrative** in 2B. `member_access.external_ref`
stays NULL until a real stable Squarespace id exists.

## Login flow (PKCE magic link)

1. `/login` → server action `requestSignInLink` → `signInWithOtp({ email, options:
   { shouldCreateUser:false, emailRedirectTo: <NEXT_PUBLIC_SITE_URL>/auth/confirm?next=… } })`.
   Always shows the same neutral message (no enumeration). The origin comes only
   from `NEXT_PUBLIC_SITE_URL` (http allowed only for localhost; `http://localhost:3000`
   fallback outside production; in production a missing/invalid value means no
   link is sent). Request headers are never used.
2. The email link reaches `/auth/confirm` (route handler). `@supabase/ssr` uses
   the PKCE flow, and both callback formats are supported:
   - **`?token_hash=…&type=email`** → `verifyOtp()` — produced by the
     **recommended** Magic Link template (below). Works across browsers/devices.
   - **`?code=…`** → `exchangeCodeForSession()` — produced by Supabase's default
     template (`{{ .ConfirmationURL }}`). Only works in the browser that requested
     the link (needs the PKCE verifier cookie).
   - Only `email`/`magiclink` types are accepted; signup, invite, recovery and
     email_change links are refused. Supabase `error`/`error_code` redirects are
     handled. Every failure redirects neutrally to `/login?error=link`.
   - Tokens, codes and URLs are never logged (only a fixed reason or sanitised
     provider error code). Responses are `no-store` and `no-referrer`.
3. `next` is reduced to a safe internal path (`safeInternalPath`): it must start
   with exactly one `/`; `//host`, `/\host`, absolute URLs, schemes, whitespace,
   control characters, backslashes, values that normalise to `//…`, and
   `/auth/…` all fall back to `/`. Applied in the login page, login action,
   confirm route and server guards.
4. Middleware + layout guards gate the destination by entitlement/role (when
   enforcement is enabled).

## Route protection

### Middleware placement

The app uses `src/app`, so Next.js 15 only loads **`src/middleware.ts`**. The
earlier root-level `middleware.ts` was ignored by the build (empty
`middleware-manifest.json`) and has been moved to `src/middleware.ts`.
Matcher: everything except `_next/static`, `_next/image`, `favicon.ico` — no
file-extension exclusion, because e.g. `/coach/members/x.png` is a real dynamic
coach route.

### Feature flag — `MPC_AUTH_ENFORCEMENT` (server-only)

| Value | Behaviour |
|-------|-----------|
| unset, `""`, `disabled`, `off`, `false`, `0` | **Disabled (default).** Middleware returns immediately; layout guards are no-ops. Existing routes, mock identities and Google workflows behave exactly as before. |
| `enabled`, `on`, `true`, `1` | **Enabled.** Fail-closed authentication + entitlement + role checks. |
| anything else | Treated as **enabled** (fail closed). |

Never prefix it `NEXT_PUBLIC_`; it is not read from cookies, headers, query
strings or any client input. Change it only together with a rebuild/redeploy
(statically prerendered pages are rendered at build time).

When **enabled**:

- Public: `/login`, `/auth/*`, `/access-required`.
- `/coach/*` → COACH or ADMIN role (else `/` for entitled members, else `/access-required`).
- Everything else → ACTIVE entitlement (staff without one → `/coach`; others →
  `/access-required`).
- Unauthenticated → `/login?next=…`. Missing Supabase config, a failed
  `getUser()` or a failed/empty `current_access_snapshot()` → deny.
- Paths are decoded, lower-cased and slash-collapsed before classification, so
  `/%63oach`, `/COACH`, `//coach` count as coach routes; undecodable paths are
  treated as coach routes.

### Server-side guards (defence in depth)

`src/services/auth/routeGuards.ts` (no-ops when disabled) is applied by new
layout files — no existing page was edited:

| Route | Guard |
|-------|-------|
| `src/app/coach/layout.tsx` (all `/coach/*`) | `enforceCoachRoute` → `requireCoachOrAdmin` |
| `/profile`, `/progress`, `/submit`, `/library`, `/challenge`, `/events`, `/benefits`, `/settings` (`layout.tsx` each) | `enforceMemberRoute` → `requireEntitledMember` |
| `/` (dashboard) | **middleware only** — the root layout also wraps `/login`, so it cannot carry a guard without editing `src/app/page.tsx` |
| `/access-required` | page itself: unauthenticated → `/login`; entitled → `/`; staff → `/coach` |

Authorisation in these guards comes only from `current_access_snapshot()`;
the mock identities in `src/lib/access.ts` are never consulted.

### Routes/workflows still insecure when enforcement is enabled

Enforcement gates **page access**. It does not yet secure the data those pages
load, because the live UI has not been switched to Supabase:

1. **Legacy Google Apps Script** (`NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL`) is a public,
   unauthenticated endpoint called from the browser by member and coach pages.
   Anyone with the URL can call it directly, bypassing middleware entirely.
2. **Mock identity in the UI.** `src/lib/access.ts` (`CURRENT_USER_ID`) and
   `src/lib/member.ts` (`CURRENT_MEMBER`) still decide who the UI *thinks* is
   signed in, which member name/email is attached to submissions, and the coach
   "access denied" screen. With enforcement on, every real user would see and
   submit as the mock member. Display + attribution must move to the server
   principal before enforcement is enabled for real members.
3. **Coach data comes from Google Sheets/Drive client-side**, not through RLS, so
   RLS gives no protection to it yet.
4. **`/` (dashboard)** has only the middleware gate (see above).
5. **Staff need an entitlement row to preview member pages** — without one they
   are redirected to `/coach`.

## Required environment variables

| Name | Scope | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | New key model (legacy fallback `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical origin for sign-in link redirects; https (http only for localhost) |
| `SUPABASE_SECRET_KEY` | **server-only** | Provisioning only (legacy fallback `SUPABASE_SERVICE_ROLE_KEY`) |
| `MPC_AUTH_ENFORCEMENT` | **server-only** | Phase 2B enforcement flag; disabled by default |

## Provisioning workflow (admin, service-role, idempotent)

`src/services/auth/provisioning.ts` (server-only):
- `provisionMember({ email, source, validFrom?, validUntil?, note?, actorAppUserId? })`
  → find/create auth user → map to `app_users` → upsert active `member_access`
  window → ensure `MEMBER` role → audit. Returns the internal UUID only.
- `revokeMemberAccess(appUserId, { reason })` → `is_active=false` + audit.

Grant coach/admin (staff) once, out of band, as `postgres` / service role:
```sql
insert into user_roles (app_user_id, role) values ('<uuid>','COACH') on conflict do nothing;
insert into user_roles (app_user_id, role) values ('<uuid>','ADMIN') on conflict do nothing;
```
(After 0010 these writes are impossible from the browser roles, by design.)

## Cancellation / expiry workflow

- **Time-boxed**: set `valid_until`; access ends automatically at that instant.
- **Manual revoke**: `revokeMemberAccess()` (or set `is_active=false`) → access
  blocked on the next request, session notwithstanding.

## Supabase dashboard configuration required (not yet done)

- Authentication → Providers → **Email** enabled.
- **Magic Link template** (recommended), so links work across devices:
  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Sign in to MPC Academy</a>
  ```
  (Keeping the default `{{ .ConfirmationURL }}` also works via the `code` path,
  but only in the requesting browser.)
- **Site URL** = `NEXT_PUBLIC_SITE_URL`; **Redirect URLs**: `<site>/auth/confirm`
  and `http://localhost:3000/auth/confirm`.
- Disable "Allow new users to sign up" (defence in depth; the app already sends
  `shouldCreateUser:false`).

## SMTP production prerequisite

Supabase's built-in email is rate-limited and **not production-ready**. Production
delivery **requires custom SMTP** (Authentication → Emails → SMTP). Not configured.

## Testing

### Unit / static (Vitest — `npm run test`)
- `accessResolution.test.ts`, `passwordless.test.ts`, `supabaseEnv.test.ts`
- `safeRedirect.test.ts` — allowed paths; `//`, `/\`, absolute, scheme, whitespace,
  control-char, normalisation and loop cases.
- `confirmParams.test.ts` — token_hash/type, code, provider errors, refused types,
  malformed and ambiguous callbacks.
- `enforcement.test.ts` — flag parsing (incl. fail-closed on unknown values), path
  classification, decisions for disabled / unauthenticated / member / expired /
  coach / admin / missing config / snapshot error; site-origin resolution.
- `securityContract.test.ts` (0009) and `rlsRoleRecursion.test.ts` (0010) —
  static SQL privilege contracts.

### Database (SQL — outside Vitest)
- `supabase/tests/phase2b_rls_roles.test.sql` — rollback-only test of the exact
  privilege matrix, member isolation, coach access, private notes, published
  feedback, expired/revoked/not-yet-valid access, privileged functions and
  service_role provisioning. Failure prefixes separate table-privilege denial from
  RLS results. Requires `0001`→`0011`.
- `supabase/tests/local/run-local.sh` — applies all migrations to **throwaway
  plain PostgreSQL** databases with a minimal Supabase shim and runs the SQL test
  from two starting points: with and without Supabase's default table grants.

### Still outstanding (must be done before go-live)
- Apply `0001`→`0011` to any non-development environment, and re-run
  `phase2b_rls_roles.test.sql` there. So far they have been applied, and the test
  has passed, only on the **development** database, as reported by the user who
  ran them.
- The Vitest `it.skip` placeholders (scenarios 16–20 and the 0009 integration
  block) remain skipped: they are covered by the SQL test, not by Vitest.
- End-to-end: login email → `/auth/confirm` → middleware redirects → provisioning,
  against the dev project with enforcement enabled.

## Rollback considerations

Additive and reversible: 0010 can be reverted by restoring the 0002 body of
`current_user_has_role` (invoker, delegating to `has_role`) and the 0007 bodies
of the resolvers, and re-granting `has_role` / table writes as before. 0008 can
be reverted by recreating the 0006 versions of the six policies; 0007 by restoring
the GUC resolver and dropping the added columns. Unsetting `MPC_AUTH_ENFORCEMENT`
returns the app to pre-2B behaviour without code changes.

## Known limitations

- Provisioning's auth-user lookup pages `listUsers` (fine at Academy scale).
- Middleware runs one RPC per protected request when enforcement is enabled.
- Enforcement flag changes require a rebuild/redeploy.

## Phase 3 handoff

Submission ownership already keys on the internal UUID, so Phase 3 (Cloudflare
Stream) can attach authenticated ownership via `current_app_user_id()` under RLS.
The member-facing submission/claim path needs an authenticated wrapper that
derives the actor from `auth.uid()` (see the comment on `transition_submission`
in 0009). Google legacy remains unchanged in 2B.
