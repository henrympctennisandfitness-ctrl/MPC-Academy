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

export interface Session {
  id: string;
  date: string;
  analysisType: string;
  coach: string;
  rating: number;
  comment: string;
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

export const SESSIONS: Session[] = [
  { id: "s1", date: "24 Jun 2026", analysisType: "Serve", coach: "Coach Marta", rating: 82, comment: "Toss is far more consistent. Keep the tossing arm up a beat longer and you'll gain easy power without swinging harder." },
  { id: "s2", date: "11 Jun 2026", analysisType: "Backhand", coach: "Coach Dan", rating: 68, comment: "Great extension through the ball. Close the racket face a touch earlier and you'll stop floating it long." },
  { id: "s3", date: "02 Jun 2026", analysisType: "Match Play", coach: "Coach Marta", rating: 74, comment: "Smart patterns under pressure. Commit to the forehand on short balls rather than rolling it back safe." },
  { id: "s4", date: "20 May 2026", analysisType: "Volley", coach: "Coach Dan", rating: 71, comment: "Soft hands are coming along. Split-step a fraction earlier and you'll reach the low volleys comfortably." },
  { id: "s5", date: "06 May 2026", analysisType: "Forehand", coach: "Coach Marta", rating: 73, comment: "Lovely racket-head speed. Finish a little higher over the shoulder for more margin on big points." },
];
