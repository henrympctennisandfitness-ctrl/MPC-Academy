# MPC Academy

Premium member portal — **project scaffold**. This is structure only: a running
Next.js app with a navigable shell and placeholder pages. No features are built
yet; each screen is intentionally empty and ready to be filled in.

## Requirements

- **Node.js 18.18+** (Node 20 LTS recommended)
- npm (or pnpm / yarn — commands below use npm)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. You can navigate every section from the sidebar
(desktop) or the bottom bar (mobile); each renders a "coming soon" placeholder.

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the dev server                  |
| `npm run build`     | Production build                      |
| `npm run start`     | Serve the production build            |
| `npm run lint`      | Lint with `eslint-config-next`        |
| `npm run type-check`| Type-check with `tsc --noEmit`        |

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript** (strict)
- **Tailwind CSS 3** — brand tokens in `tailwind.config.ts`
- **lucide-react** — icons

## Project structure

```
src/
  app/                 # App Router: routes + layout
    layout.tsx         # Root layout: font, metadata, <AppShell>
    page.tsx           # Home
    submit/            # /submit
    progress/          # /progress
    library/           # /library
    benefits/          # /benefits
    events/            # /events
    challenge/         # /challenge
    settings/          # /settings
    loading.tsx        # Route-level loading state
    error.tsx          # Route error boundary
    not-found.tsx      # 404
    globals.css        # Tailwind layers + base resets
  components/
    layout/            # AppShell, Sidebar, BottomNav, PagePlaceholder
    ui/                # Reusable primitives (Button, Card)
  lib/
    config.ts          # App config, Google endpoint, feature flags
    constants.ts       # Navigation model (single source of truth)
    utils.ts           # cn() className helper
  types/               # Shared domain types
  hooks/               # Reserved for shared hooks
  features/            # Future modules (auth, billing, ai) — stubs only
```

## Design tokens

Defined once in `tailwind.config.ts`:

- `brand` — Deep Forest Green `#0E4D3A` (`brand-dark`, `brand-tint`)
- `gold` — Soft Gold `#D4AF37` (`gold-tint`)
- `background` `#FAFAFA` · `surface` `#FFFFFF` · `ink` `#1C1C1C` · `muted` `#6B7280` · `line` `#ECECEC`

## Configuration

Copy `.env.example` to `.env.local`. Nothing is required to run the scaffold.
The only wired integration point is `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL`
(read in `src/lib/config.ts`) for the future no-backend Google upload flow.

## Roadmap hooks

Future work is gated behind flags in `src/lib/config.ts` (`FEATURES`) and
scaffolded as empty modules under `src/features/`: **auth**, **billing** (Stripe)
and **ai** (technique analysis). Add features behind their flag to keep `main`
clean.
