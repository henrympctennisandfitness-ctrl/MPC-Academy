# Phases

The V2 roadmap. Each phase is gated: implement, review, then proceed. Future
phases must not be pre-built (decision A) and their schemas are designed in-phase.

## Fixed architecture (all phases)

| Layer | Authority |
|-------|-----------|
| Squarespace | Membership / payment authority |
| MPC internal UUID (`app_users.id`) | Application ownership identity |
| Supabase / Postgres | Application state |
| Cloudflare Stream | Private video infrastructure (from Phase 3) |
| Coach Studio | Operational coaching interface |

We do **not** assume how Squarespace authentication works until Phase 2
investigation.

## 1. Foundation ✅ (this phase)

Database schema (minimal), RLS on all tables, entitlement engine, submission
state machine, provider-abstracted video metadata, repository seam, security
audit, docs. Live UI unchanged; no Supabase required to run.

**Acceptance:** migrations apply cleanly; RLS enabled everywhere with no bypass;
entitlement consume/restore rules defined and unit-tested; state machine enforced
(members cannot reach IN_REVIEW/COMPLETED); seam lets the app run without Supabase;
type-check / lint / build / tests pass; docs complete.

## 2. Squarespace Access

Investigate and implement how a verified Squarespace membership maps to the
internal UUID; set the `app.current_member_id` GUC per verified request so RLS
attributes rows. Begin switching read paths onto Supabase behind the seam.

**Acceptance:** verified session resolves to an internal UUID; RLS enforced at
runtime for members and coaches; no reliance on email/name as identity; coach
authorization enforced server-side (closes the UI-only gap).

## 3. Video Analysis V2 (Cloudflare Stream)

Private video upload/playback via Cloudflare Stream; wire the real create flow
(entitlement claim at upload start, SYSTEM transitions for processing, release on
failure). Represent legacy Google submissions alongside Cloudflare assets.

**Acceptance:** private playback (no permanent public URLs); atomic entitlement
consumption under concurrency; failure/cancel paths restore units; legacy
submissions still representable.

## 4. Messaging

Member↔coach messaging. Schema designed in-phase (threads, messages,
assignments), all keyed on the internal UUID with RLS.

**Acceptance:** ownership-scoped threads; RLS-enforced; no premature coupling to
earlier phases beyond the shared identity.

## 5. 15-minute Review Calls

Booking and scheduling for short review calls. Schema designed in-phase
(bookings, availability), UUID-keyed with RLS.

**Acceptance:** conflict-free booking; RLS-scoped; auditable.

## 6. Content Studio

Coaching content/library and challenges. Schema designed in-phase (content items,
challenges, library), UUID-keyed with RLS, admin-managed.

**Acceptance:** admin-authored content; correct visibility via RLS; no leakage
across members.

## Notes

- Phase 4–6 tables are intentionally **not** created in Phase 1.
- Each phase adds its own repository + Supabase implementation behind an
  interface, and its own RLS policies in the established ownership/role pattern.
