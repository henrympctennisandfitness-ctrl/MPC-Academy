# MPC Academy

## Project Overview

MPC Academy is a premium online tennis coaching platform.

The experience should feel closer to Apple, WHOOP, Linear and Soho House than a traditional coaching website.

The platform is mobile-first and complements an existing Squarespace website.

---

# Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Framer Motion
- Vercel
- Google Drive (planned)
- Google Sheets (planned)
- Google Apps Script (planned)

---

# Authentication

Authentication has intentionally NOT been implemented.

Do NOT add:

- Clerk
- NextAuth
- Supabase Auth
- Firebase Auth
- Auth0
- Any authentication provider

A mock role system is currently used.

Real authentication will be implemented after the platform is feature complete.

---

# Current Roles

Henry Macdonald
- Admin
- Head Coach

Calum Meston
- Coach
- Head Coach

All other users
- Academy Member

Only Admins and Coaches may access the Coach Studio.

---

# Current Features

Completed

- Member Dashboard
- Coach Studio
- Submit Analysis
- Progress
- Coaching Library
- Member Profiles
- Coach Feedback UI
- Mock role system

In Progress

- Google Drive upload
- Google Sheets integration

Planned

- Notifications
- Authentication
- Apple Wallet Membership
- AI Coaching
- Analytics

---

# Design Philosophy

Everything should feel:

- Premium
- Minimal
- Fast
- Modern
- Private Club

Inspired by:

- Apple
- WHOOP
- Linear
- Notion
- Nike
- Porsche
- Soho House

Avoid anything that looks generic or like Bootstrap.

---

# Development Rules

Always preserve the existing architecture.

Do not rewrite unrelated files.

Reuse components.

Reuse Tailwind design tokens.

Keep logic modular.

Keep pages thin.

Use feature-based architecture.

No technical debt.

If a file does not need changing, leave it untouched.

---

# Google Integration

Google Drive stores videos.

Google Sheets stores metadata.

Google Apps Script is the backend.

Do NOT introduce a custom backend.

---

# Coach Studio

Only Henry and Calum can access.

Members must never see:

- Coach Dashboard
- Coach Queue
- Other Members

---

# Member Portal

Members should only see:

- Dashboard
- Submit Analysis
- My Progress
- Coaching Library
- My Profile
- Settings

---

# Future Tasks

Always build one major feature at a time.

Suggested order:

1. Google Drive upload
2. Google Sheets integration
3. Coach feedback persistence
4. Member progress sync
5. Notifications
6. Authentication
7. AI coaching
8. Analytics

---

# Every Task

Before coding:

- Read CLAUDE.md

After coding provide:

- Files Added
- Files Modified
- Dependencies Added
- Dependencies Removed
- Manual Steps