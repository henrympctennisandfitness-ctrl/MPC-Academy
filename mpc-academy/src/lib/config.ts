/**
 * Central app configuration.
 * Single source of truth for branding, external endpoints and feature flags.
 * Keep environment-specific values in `.env.local` (see `.env.example`).
 */

export const APP = {
  name: "MPC Academy",
  shortName: "MPC",
  description: "Your premium coaching membership.",
  tagline: "Train with intent.",
} as const;

/**
 * Google integration (no backend).
 * Point this at a deployed Apps Script Web App that stores the uploaded video
 * in Drive and appends a row to Sheets. Empty string = not configured yet.
 */
export const GOOGLE_CONFIG = {
  appsScriptUrl: process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL ?? "",
  maxUploadBytes: 2 * 1024 * 1024 * 1024, // 2GB
  acceptedVideo: ["video/mp4", "video/quicktime", "video/mpeg"] as const,
} as const;

/**
 * Feature flags — everything ships off until the feature is built.
 * Gate future work behind these so the scaffold stays clean.
 */
export const FEATURES = {
  auth: false,
  billing: false, // Stripe
  aiCoaching: false, // AI technique analysis
  coachMessaging: false,
  videoAnnotations: false,
  voiceoverFeedback: false,
  progressGraphs: false,
  pushNotifications: false,
  tournamentStats: false,
  wearableIntegration: false,
  achievements: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
