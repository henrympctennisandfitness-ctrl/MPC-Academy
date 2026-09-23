-- 0001_init_extensions_enums.sql
-- MPC Academy V2 — Phase 1 Foundation.
-- Extensions + enum types. Applied via the Supabase CLI (never the dashboard).

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- Application roles (never member NAMES in policies — roles only).
create type app_role as enum ('MEMBER', 'COACH', 'ADMIN');

-- Submission lifecycle. Allowed transitions are documented in docs/DATABASE.md
-- and enforced by transition_submission() + mirrored in src/services/submissions/stateMachine.ts.
create type submission_status as enum (
  'DRAFT','UPLOADING','PROCESSING','SUBMITTED','IN_REVIEW','COMPLETED','FAILED','CANCELLED'
);

-- Video storage provider abstraction: Google Drive is LEGACY; Cloudflare Stream arrives in Phase 3.
create type video_provider as enum ('GOOGLE_DRIVE_LEGACY', 'CLOUDFLARE_STREAM');

-- Data classes for retention configuration (Phase-1 relevant classes only).
create type data_class as enum ('VIDEO','FEEDBACK','SUBMISSION','TECH_LOG','INACTIVE_MEMBER');
