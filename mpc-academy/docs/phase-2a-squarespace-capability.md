# Phase 2A — Squarespace Membership Access Capability Probe

Status: **research + minimal server-only probe complete.** No login, no Supabase
Auth, no RLS change, no route protection, no deploy. This document records what
the **supported, official** Squarespace developer APIs can and cannot do for
membership verification, and answers the four Phase 2A questions.

Sources are official Squarespace developer/help documentation (verified
2026-09-23). Third-party blogs/forums were used only for orientation and are not
relied on for capability claims.

---

## 1. Executive summary

- Squarespace **OAuth 2.0 is app-to-site authorization**, not member SSO. The
  party who authorizes is the **site owner/admin**, granting an app access to the
  site's data. There is no supported "Sign in with Squarespace" that
  authenticates an individual **customer/member** into a third-party app and
  returns their identity + entitlement.
- The supported public APIs are the Commerce APIs: **Orders, Products, Inventory,
  Transactions, Profiles (maintenance mode → Contacts), Contacts, Discounts,
  Analytics, Website, and Webhook Subscriptions.** There is **no Memberships /
  Member Sites / pricing-plan API.**
- **Pricing-plan ("Member Areas" / "Member Sites") membership status** — which
  plan a member is on, "Member since", "Subscriber since", active vs cancelled —
  is available in the Squarespace **admin Contacts panel and CSV export**, but is
  **not exposed by any supported developer API.**
- The **Orders API** can prove a customer *purchased* something (one-time or a
  recurring subscription order) and expose `fulfillmentStatus`, `paymentState`,
  and a stable `customerId` — but an order is a **historical financial event**.
  There is **no field for current subscription/membership status, no subscription
  id, and no renewal date.**
- **Webhook topics** are limited to `order.create`, `order.update` (plus
  contact/address events and `extension.uninstall`). There is **no
  subscription/membership lifecycle event** (no "cancelled"/"expired").
- **Therefore active membership cannot be reliably determined from the supported
  public APIs today.** The probe fails closed (see §10–§11).

**Bottom line (answer to the required question, §11): NOT YET PROVEN — and, for
the specific requirement "distinguish current ACTIVE membership from
cancelled/expired/historical/non-member", effectively NO with the supported
public APIs as documented.** Live verification against MPC's actual site is the
only way to close the residual (§15).

---

## 2. Official Squarespace capabilities found

| API | Purpose (official) | Useful for membership? |
|-----|--------------------|------------------------|
| Website / Authorization | Identify the site and the OAuth-authenticated **Squarespace user** (the merchant) | Confirms OAuth ≠ member SSO |
| Orders | Order history incl. recurring subscription **orders**; filter by `customerId`; `fulfillmentStatus`, `paymentState` | Proves *purchase*, not *current membership* |
| Transactions | Financial transactions for orders/donations | Payment detail; not membership status |
| Products | Manage store products/variants | Identify the plan's product id (to match line items) |
| Profiles (maintenance) → Contacts | Read customers/subscribers/donors; transaction summary | Stable customer/contact **id**; no plan-status field documented |
| Analytics | Aggregated commerce data for contacts | Aggregates only |
| Discounts, Inventory | Discounts / stock | Not relevant |
| Webhook Subscriptions | `order.create`, `order.update`, contact/address events, `extension.uninstall` | Order lifecycle only; no subscription lifecycle |

Docs: Commerce overview `https://developers.squarespace.com/commerce-apis/overview`;
Commerce intro `https://developers.squarespace.com/commerce-api`.

---

## 3. OAuth findings

- Official: *"Squarespace uses OAuth 2.0 to authorize third-party applications to
  integrate with Squarespace and consume Squarespace APIs."* The `/authorize`
  page asks a **user to authorize client access to their Squarespace data.**
  Doc: `https://developers.squarespace.com/oauth`.
- The Website API's `Member` resource is *"the Squarespace user authenticated via
  an OAuth token"* — i.e. the account that installed/authorized the app (the
  merchant), **not** a site customer.
  Doc: `https://developers.squarespace.com/commerce-apis/website-overview`.
- OAuth scopes are **site-data scopes** (e.g. `website.orders`,
  `website.orders.read`, `website.transactions.read`, `website.products`,
  `website.contacts`) — there is no "authenticate this customer / return their
  membership" scope.
- **Conclusion:** OAuth is **not** member SSO. Do **not** implement a
  "Sign in with Squarespace" member login — it is unsupported. (API-key auth for
  Commerce also exists and is likewise a site-owner credential, not member login.
  Doc: `https://support.squarespace.com/hc/en-us/articles/236297987`.)

---

## 4. Contacts / customer identity findings

- The **Contacts API** (successor to the maintenance-mode **Profiles API**)
  manages customers, subscribers, and donors, with stable resource **ids** and a
  transaction summary. Docs:
  `https://developers.squarespace.com/commerce-apis/profiles-overview`,
  `https://developers.squarespace.com/commerce-apis/overview`.
- A **stable identifier exists**: the Contact/Profile **id**, and the **`customerId`**
  referenced by orders. Either is a suitable opaque external identity to map to
  MPC's internal UUID.
- **No documented per-contact "pricing-plan membership status" field** is exposed
  by the API. The plan membership columns ("Member areas", "Member since",
  "Subscriber since") are described only for the **admin Contacts panel / CSV
  export**, not the API.
  Doc: `https://support.squarespace.com/hc/en-us/articles/360050832691-Managing-members`.
- Contacts API today is OAuth-only (API-key "coming soon" per Squarespace's own
  messaging) and contact webhooks may lag — to be confirmed live.

---

## 5. Orders / subscription findings

- The **Orders API** exposes *"order history for one-time purchases and
  subscription orders"* and can filter by `customerId`.
  Doc: `https://developers.squarespace.com/commerce-apis/orders-overview`.
- Documented Order fields include `fulfillmentStatus` (`PENDING` / `FULFILLED` /
  `CANCELED`), `paymentState` (`NOT_CHARGED` / `AUTHORIZED` / `PAID` /
  `PARTIALLY_PAID` / `REFUNDED`), `customerId`, `customerEmail`, `createdOn`,
  `modifiedOn`, and `lineItems`.
  Docs: `https://developers.squarespace.com/commerce-apis/retrieve-all-orders`,
  `https://developers.squarespace.com/commerce-apis/retrieve-specific-order`.
- **What is missing for membership:** no current **subscription status**
  (active/cancelled/expired), no **subscription id**, no **renewal/next-billing
  date**, no **entitlement** field. A recurring plan produces a *series of orders*
  over time; the API does not report whether the subscription is *still active*.
- Consequently, "the customer has an order for the MPC plan" proves only a
  **historical purchase**, which the Phase 2A brief explicitly says must **not**
  be treated as current membership.

---

## 6. Pricing-plan / member-status findings (the decisive question)

- Squarespace **Member Areas / Member Sites** (paid, gated content via **pricing
  plans**: free, fixed-amount, or subscription) is the feature MPC Academy uses.
- **No supported developer API surfaces pricing-plan membership state.** The
  member/pricing-plan data lives in the admin **Contacts panel** and the **CSV
  export** ("Member areas", "Member since", "Subscriber since").
  Doc: `https://support.squarespace.com/hc/en-us/articles/360050832691-Managing-members`.
- Plan **semantics differ**: a **fixed-amount** plan grants long-lasting access
  (no expiry), while a **subscription** plan requires ongoing payment — so even a
  hypothetical "has plan" signal would mean different things per plan type.
  Doc: `https://support.squarespace.com/hc/en-us/articles/4404628246669-Pricing-plan-details`.
- **Conclusion:** the supported public API cannot, by documentation, distinguish
  **active** from **cancelled/expired** pricing-plan membership.

---

## 7. Webhook findings

- Supported webhook **topics**: `extension.uninstall`, `order.create`,
  `order.update` (plus `contact.*` / `address.*` per the WebhookSubscriptions
  scopes). Docs:
  `https://developers.squarespace.com/commerce-apis/create-webhook-subscription`,
  `https://developers.squarespace.com/commerce-apis/webhooksubscriptions`,
  `https://developers.squarespace.com/webhooks/events/order-update`.
- `order.update` fires for `FULFILLED`, `REFUNDED`, `CANCELED`, `MARKED_PENDING`,
  `EMAIL_UPDATED`. **There is no subscription/membership lifecycle topic**
  (no "subscription.cancelled" / "membership.expired").
- **Implication:** a webhook-maintained entitlement mirror can observe new and
  renewed **orders**, but **cannot reliably observe a cancellation or expiry**,
  because those do not emit a distinct event — you only see the *absence* of a
  future renewal order, which is not a timely or reliable "inactive" signal.
- Webhooks require OAuth (API keys not supported for webhook subscriptions) and a
  subscription secret for signature verification (rotate supported).

---

## 8. Security considerations

- **Credentials are server-only.** Commerce API keys and OAuth tokens are
  site-owner secrets; they must never reach the browser and must never be
  prefixed `NEXT_PUBLIC_`. The probe enforces this (throws in a browser context).
- **Webhook signature verification** is required if webhooks are used in 2B
  (verify the subscription secret; support rotation).
- **Fail closed.** If membership cannot be verified — or Squarespace is
  unavailable and no trustworthy synchronized entitlement exists — the system
  must **deny** access. The probe returns `accessDecision: "DENY"` whenever active
  membership is not determinable (which, with today's APIs, is always).
- **No "ever purchased = active" rule.** Explicitly avoided; the classifier never
  infers active membership from a historical order.
- **Token handling in the probe:** the credential is read at call time, sent only
  in the `Authorization` header, never logged, never returned, never placed in a
  URL; error paths avoid echoing response bodies that could contain personal data.

---

## 9. Privacy / data-minimisation considerations

- The probe emits **structural/redacted output only**: `customerId`
  present/absent, whether a matching membership order exists, the latest matching
  order date, and order fulfillment/payment enums. It **never** emits names,
  emails, addresses, or payment details. A unit test asserts no `@`/email leaks.
- **No real-member fixtures.** Test fixtures use entirely fictional ids/data.
- **Identity mapping:** the eventual key is the **stable Squarespace external id**
  (`customerId` / Contact id) → **MPC internal UUID** via Phase 1's
  `member_access.external_ref`. **Email is not the ownership key**; it may be used
  only in a future verification/bootstrap step.

---

## 10. Results of the capability probe

The probe is pure, server-only where it touches the network, and dev-only /
fail-closed. Given supported-API order data it reports:

- `customerId`: present / absent (external-ref candidate)
- `hasMatchingMembershipOrder`: whether any line item matched a configured plan id
- `latestMatchingOrderDate`: a *purchase event* date, not proof of active
- `matchingOrderFulfillment` / `matchingOrderPayment`: order-state enums
- `activeMembershipDeterminable`: **false** (with the documented reason)
- `accessDecision`: **DENY**

Unit tests (fictional fixtures, no network) prove: a historical PAID/FULFILLED
membership order does **not** yield active membership; non-members and
empty-order cases deny; `customerId` is surfaced as an external-ref candidate;
and no personal data appears in the output. The live runner (`liveProbe.ts`) is
disabled unless run server-side, outside production, with a credential present;
it was **not executed** here (no credentials; sandbox has no network).

---

## 11. Exact answer

**"Can MPC Academy reliably determine whether a Squarespace customer currently
has an ACTIVE MPC Academy membership using supported Squarespace APIs?"**

### Answer: **NOT YET PROVEN** (and, as documented, effectively **NO** today).

Why:
1. **No membership/pricing-plan status API.** Plan membership and its active
   state live in the admin Contacts panel / CSV export, not in any supported
   developer API.
2. **OAuth is not member SSO.** There is no supported way to authenticate an
   individual member and read their entitlement.
3. **Orders prove history, not current state.** No subscription status field, id,
   or renewal date; a subscription order is a past event.
4. **No cancellation/expiry signal.** Webhooks cover order lifecycle only; a
   cancelled/expired subscription emits no event and no readable "inactive" state.

Because current active membership cannot be proven from supported APIs, the
correct outcome is to **fail closed** and to treat this as a **STOP-and-report**
result for the strict requirement — exactly what Phase 2A asked for. The residual
"NOT YET PROVEN" (vs a hard NO) exists only because a few site-specific behaviours
can only be confirmed on MPC's live site (§15).

---

## 12. Recommended Phase 2B architecture

Given the boundary, keep **Squarespace as the commercial authority** but make the
**access decision from MPC's own synchronized entitlement state** (fail closed
when unknown/stale). Do **not** build member SSO.

Proposed (subject to §15 live verification):

1. **Bootstrap link (one-time):** verify a member and resolve their **stable
   Squarespace `customerId`/Contact id**; store it as `member_access.external_ref`
   → `app_users.id` (internal UUID). Email may be used *only* to bootstrap the
   link, never as the ownership key.
2. **Entitlement mirror in Supabase:** maintain a per-member entitlement window in
   MPC's own DB. Populate/refresh it from Squarespace commerce data:
   - **Webhooks** (`order.create` / `order.update`) to catch new/renewed
     membership orders in near-real-time (verify signatures).
   - **Periodic reconciliation** via the Orders API (`modifiedAfter`, filter by
     `customerId`, match plan product id) as the source of truth / backstop.
3. **Time-based validity, fail-closed expiry:** because there is no cancellation
   event, compute an entitlement window from each membership order's billing
   period (+ a defined grace) and **expire automatically** if no qualifying
   renewal order arrives. Never treat an old order as ongoing access.
4. **Access = MPC entitlement check** (later wired to Supabase RLS via the
   internal UUID). If entitlement is missing/stale/unknown → **deny**.
5. **Confirm plan semantics:** handle fixed-amount (perpetual) vs subscription
   (recurring) plans distinctly.

This is a design proposal only. Phase 2B must not begin without approval, and its
feasibility depends on the live checks in §15.

---

## 13. Manual Squarespace configuration Henry must perform

1. Create a **server-side Commerce API key** (scopes: Orders read, Transactions
   read) **or** register an **OAuth client** (needed for Contacts + Webhooks).
   Doc: `https://support.squarespace.com/hc/en-us/articles/236297987`.
2. Identify the **exact pricing-plan / product identifier(s)** for the MPC Academy
   membership (to match order line items).
3. Confirm on the **live site** which fields membership orders actually expose
   (line-item product id, recurring indicator) and whether membership subscription
   payments appear as Orders API orders.
4. Confirm the **plan type** (subscription vs fixed-amount) — it changes expiry
   semantics.
5. (If webhooks used) create a webhook subscription and record the **signing
   secret** securely (server-only).

No credentials should be sent to me or committed; these are for Henry's own
environment.

---

## 14. Environment variables required for the next step (placeholders only)

Server-only; **never** `NEXT_PUBLIC_`. Add to `.env.local` (and, when the team is
ready, merge the placeholder names into `.env.example`):

```
# Squarespace probe / Phase 2B (server-only; never NEXT_PUBLIC_)
SQUARESPACE_API_BASE=              # default https://api.squarespace.com
SQUARESPACE_API_VERSION=           # default 1.0
SQUARESPACE_API_KEY=               # server-only Commerce API key (Orders/Transactions read)
# OAuth path (Contacts/Webhooks), if used instead of/with an API key:
# SQUARESPACE_OAUTH_CLIENT_ID=
# SQUARESPACE_OAUTH_CLIENT_SECRET=
# SQUARESPACE_OAUTH_REFRESH_TOKEN=
SQUARESPACE_WEBHOOK_SECRET=        # for webhook signature verification (2B)
SQUARESPACE_MEMBERSHIP_PRODUCT_IDS= # comma-separated plan/product ids to match
```

These placeholder names were kept **out** of the committed `.env.example` in this
change to avoid overwriting existing uncommitted work; merge them in when
convenient.

---

## 15. Open questions / blockers (the residual behind "NOT YET PROVEN")

Each requires a **live** Squarespace site + real credential to settle; none can be
resolved from documentation alone:

1. Do MPC's **membership (Member Sites pricing-plan) payments appear as Orders API
   orders**, and with a **matchable product/line-item id**? (Docs describe general
   subscription orders; membership specifics need live confirmation.)
2. Is a **cancellation/expiry** ever observable via `order.update` or any field?
   (Documentation suggests **no**.)
3. Does the **Contacts API** expose any per-contact pricing-plan marker on MPC's
   current plan? (Docs suggest **no**; verify.)
4. Are **contact webhooks** live, and what are the exact **signature-verification**
   details?
5. What is MPC's plan **type** (subscription vs fixed-amount), which determines
   expiry logic?

**Stop condition met:** the supported documentation does **not** expose active
pricing-plan membership status, and member SSO is unsupported. Per Phase 2A this
is a **successful stop** — the capability boundary is now established. Do not
proceed to Phase 2B without explicit approval and the §15 live confirmations.
