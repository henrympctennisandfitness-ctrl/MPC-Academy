import {
  Flag,
  Flame,
  Zap,
  CheckCircle2,
  Medal,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/**
 * My Progress — domain types + mock data.
 * In-memory for now (mirrors the coach feature's approach). Swap these for
 * Google Sheets rows once the read side is wired.
 */

export interface ShotRating {
  key: "serve" | "forehand" | "backhand" | "volley";
  label: string;
  value: number; // 0–100
  delta: number; // change vs last month
}

export interface Goal {
  id: string;
  title: string;
  detail: string;
  progress: number; // 0–100
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  earned: boolean;
  date?: string;
}

export const OVERALL = { value: 75, delta: 4, label: "Overall rating" };

export const SHOT_RATINGS: ShotRating[] = [
  { key: "serve", label: "Serve", value: 82, delta: 6 },
  { key: "forehand", label: "Forehand", value: 76, delta: 3 },
  { key: "backhand", label: "Backhand", value: 68, delta: -2 },
  { key: "volley", label: "Volley", value: 74, delta: 5 },
];

export const GOALS: Goal[] = [
  { id: "g1", title: "Lift backhand consistency", detail: "Reach a 75 rating", progress: 68 },
  { id: "g2", title: "Add depth to the first serve", detail: "More weight, same shape", progress: 55 },
  { id: "g3", title: "Sharpen net footwork", detail: "Earlier split-step at the net", progress: 40 },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: "a1", title: "First analysis", description: "Submitted your first clip", icon: Flag, earned: true, date: "May 2026" },
  { id: "a2", title: "Five reviews", description: "Completed 5 coach reviews", icon: CheckCircle2, earned: true, date: "Jun 2026" },
  { id: "a3", title: "Week streak", description: "Trained 7 days running", icon: Flame, earned: true, date: "Jun 2026" },
  { id: "a4", title: "Serve 80+", description: "Serve rating above 80", icon: Zap, earned: true, date: "Jun 2026" },
  { id: "a5", title: "Twenty-five reviews", description: "Complete 25 reviews", icon: Medal, earned: false },
  { id: "a6", title: "All-court", description: "Every shot rated 75+", icon: Trophy, earned: false },
];

// Coaching history (past sessions) now comes live from Google Sheets — see
// `useMemberProgress` in ../store and the SessionTimeline component.
