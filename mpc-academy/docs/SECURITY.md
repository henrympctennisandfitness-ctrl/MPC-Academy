# Security

This covers (1) the security model Phase 1 introduces and (2) the audit findings
requested in decision H. **No secret values are printed here.** Where a credential
may need rotation, only its *type* is named.

## Audit findings

Scope: repository contents, environment configuration, client/server boundaries,
the legacy Google integration, and enumeration/validation risks.

| # | Finding | Severity | Status / recommendation |
|---|---------|----------|--------------------------|
| 1 | **No committed secrets found.** The only env var currently used by the app is the *public* Apps Script URL. `.gitignore` excludes `.env` and `.env*.local`; `.env.example` holds blanks only. | — | No secret rotation required from the repo. If a real key was ever pasted into a commit historically, rotate by **type** (see below) — but none is present now. |
| 2 | **Apps Script endpoint is unauthenticated.** The Google Apps Script `/exec` URL is a public write endpoint with no auth; anyone with the URL can POST. It is exposed as `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL`, so it necessarily ships to the browser. | High (legacy) | Freeze and do not expand (decision 7). Being retired across V2. If the URL was ever shared/leaked, rotate by **redeploying the Apps Script to get a new `/exec` URL** (the credential type to rotate is the *Apps Script deployment URL*, not a secret key). |
| 3 | **Google Drive files use “anyone with the link”.** Legacy uploads set link-visible sharing, i.e. unlisted-public videos → privacy exposure and IDOR-style guessing of file ids. | High (legacy) | Documented limitation. The V2 design (Cloudflare Stream, Phase 3) uses private playback; `video_assets` deliberately avoids permanent public URLs as the long-term design (decision G). |
| 4 | **Coach authorization is UI-only today.** Access to Coach Studio is gated in the client (`src/lib/access.ts` + shell routing). A determined user could reach coach views without server enforcement. | High | Phase 1 introduces the real enforcement layer: **RLS + role checks in Postgres**. The live UI is not switched onto it yet (decision B), so until Phase 2 wiring, coach gating remains UI-only. Tracked as *not-yet-production-safe*. |
| 5 | **Legacy Drive path used member names.** The legacy folder scheme derived from member names. V2 forbids name-as-identity (decision C); identity is the internal UUID. | Medium | Do not extend the legacy scheme. New design keys everything on the UUID. |
| 6 | **Member enumeration risk.** Member profile routes used guessable slugs, allowing enumeration. | Medium | V2 ownership is the internal UUID and RLS denies cross-member reads. Avoid guessable public identifiers in new routes; do not expose enumeration in the switched-on UI. |
| 7 | **Server-side input validation absent.** Submission validation existed only on the client. | Medium | Phase 1 adds a Zod schema (`src/services/submissions/validation.ts`) as the server-side boundary; Phase 3 wires it into the real create path. Never trust the client. |
| 8 | **No service-role key in client code.** Verified: the service-role key is server-only, read from a non-`NEXT_PUBLIC_` var, and guarded so any browser access throws. | — | Maintained by `src/services/database/env.ts` + `supabaseClient.ts`. |
| 9 | **No production debug code / secret logging found** in the service layer added this phase. | — | Keep logs free of tokens, URLs with credentials, and personal data. |

### Credential types to rotate (only if ever exposed)
- **Apps Script deployment URL** — rotate by redeploying to mint a new `/exec` URL.
- **Supabase service-role key** — if it is ever placed anywhere client-reachable,
  rotate it in the Supabase dashboard. (Not present in the repo.)

No secret values are included in this document by design.

## Security model introduced in Phase 1

### Environment boundary
- **Public:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Public
  by design; RLS still governs every row.
- **Server-only:** `SUPABASE_SERVICE_ROLE_KEY`. Never `NEXT_PUBLIC_`, never in a
  client bundle. `getServiceRoleKey()` throws if accessed in a browser context.
- **Legacy:** `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL` (unauthenticated; see finding 2).

### RLS (decision D)
- Enabled on all 12 tables; **never disabled** as a workaround; **no production bypass**.
- Member-ownership policies use `current_app_user_id()`, which resolves from the
  `app.current_member_id` GUC that a **verified Phase 2 session** sets. Until
  then it is NULL, so those policies **deny by default** (safe posture, not a bypass).
- Coach/admin policies use `current_user_has_role()`.
- The **service role bypasses RLS** and is used only server-side for migrations,
  SECURITY DEFINER functions, and trusted SYSTEM transitions.

### Client vs server separation
Barrels never re-export the Supabase client factory or the Supabase repositories,
keeping the RLS-bypass path and service-role usage out of client bundles.

## Still UI-only until Phase 2 (explicit)
Coach authorization, member scoping, and identity resolution are **not** enforced
at runtime yet because the live UI is deliberately not switched onto Supabase in
Phase 1. This is listed under *Not Yet Production-Safe* in the phase report.
