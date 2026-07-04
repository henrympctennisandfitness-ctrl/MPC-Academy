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
 * Member profiles — domain types + seed roster.
 * In-memory for now (mirrors the coach/progress features). Each member has a
 * URL-friendly `slug` so profiles can be linked directly from Squarespace,
 * e.g. /members/henry-macdonald.
 */

export interface ShotRating {
  key: "serve" | "forehand" | "backhand" | "volley";
  label: string;
  value: number; // 0–100
}

export interface ProfileGoal {
  id: string;
  title: string;
  detail: string;
  progress: number; // 0–100
}

export interface ProfileReview {
  id: string;
  date: string;
  analysisType: string;
  coach: string;
  rating: number;
  comment: string;
}

export interface ProfileAchievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  earned: boolean;
  date?: string;
}

export interface Member {
  slug: string;
  name: string;
  initials: string;
  image?: string; // optional avatar URL (initials shown when absent)
  membershipId: string;
  level: string; // playing level
  hand: "Right-handed" | "Left-handed";
  favouriteShot: string;
  joined: string;
  tier: "Standard" | "Elite";
  overall: number; // 0–100
  ratings: ShotRating[];
  goals: ProfileGoal[];
  reviews: ProfileReview[];
  coachNote: { coach: string; text: string };
  achievements: ProfileAchievement[];
}

const baseAchievements = (
  earned: string[],
): ProfileAchievement[] => [
  { id: "first", title: "First analysis", description: "Submitted a first clip", icon: Flag, earned: earned.includes("first"), date: "May 2026" },
  { id: "five", title: "Five reviews", description: "Completed 5 reviews", icon: CheckCircle2, earned: earned.includes("five"), date: "Jun 2026" },
  { id: "streak", title: "Week streak", description: "Trained 7 days running", icon: Flame, earned: earned.includes("streak"), date: "Jun 2026" },
  { id: "serve80", title: "Serve 80+", description: "Serve rating above 80", icon: Zap, earned: earned.includes("serve80"), date: "Jun 2026" },
  { id: "allcourt", title: "All-court", description: "Every shot rated 75+", icon: Trophy, earned: earned.includes("allcourt") },
  { id: "twentyfive", title: "Twenty-five reviews", description: "Complete 25 reviews", icon: Medal, earned: earned.includes("twentyfive") },
];

export const MEMBERS: Member[] = [
  {
    slug: "henry-macdonald",
    name: "Henry Macdonald",
    initials: "HM",
    membershipId: "MPC-2041",
    level: "Advanced · NTRP 4.0",
    hand: "Right-handed",
    favouriteShot: "Forehand",
    joined: "Jan 2025",
    tier: "Elite",
    overall: 76,
    ratings: [
      { key: "serve", label: "Serve", value: 82 },
      { key: "forehand", label: "Forehand", value: 78 },
      { key: "backhand", label: "Backhand", value: 68 },
      { key: "volley", label: "Volley", value: 74 },
    ],
    goals: [
      { id: "g1", title: "Lift backhand consistency", detail: "Reach a 75 rating", progress: 68 },
      { id: "g2", title: "Add depth to the first serve", detail: "More weight, same shape", progress: 55 },
    ],
    reviews: [
      { id: "r1", date: "24 Jun 2026", analysisType: "Serve", coach: "Coach Marta", rating: 82, comment: "Toss is far more consistent. Keep the tossing arm up a beat longer for easy power." },
      { id: "r2", date: "11 Jun 2026", analysisType: "Backhand", coach: "Coach Dan", rating: 68, comment: "Great extension. Close the racket face a touch earlier and you'll stop floating it long." },
      { id: "r3", date: "02 Jun 2026", analysisType: "Match Play", coach: "Coach Marta", rating: 74, comment: "Smart patterns under pressure. Commit to the forehand on short balls." },
    ],
    coachNote: { coach: "Coach Marta", text: "Henry has one of the best forehands in the academy. If we can get the backhand to match, he'll be genuinely tough to play against this season." },
    achievements: baseAchievements(["first", "five", "streak", "serve80"]),
  },
  {
    slug: "priya-sharma",
    name: "Priya Sharma",
    initials: "PS",
    membershipId: "MPC-1187",
    level: "Competitive · NTRP 4.5",
    hand: "Right-handed",
    favouriteShot: "Backhand",
    joined: "Nov 2024",
    tier: "Elite",
    overall: 84,
    ratings: [
      { key: "serve", label: "Serve", value: 80 },
      { key: "forehand", label: "Forehand", value: 85 },
      { key: "backhand", label: "Backhand", value: 88 },
      { key: "volley", label: "Volley", value: 82 },
    ],
    goals: [
      { id: "g1", title: "Sharpen serve placement", detail: "Hit the corners at pace", progress: 72 },
      { id: "g2", title: "Finish at the net more", detail: "Convert approach chances", progress: 60 },
    ],
    reviews: [
      { id: "r1", date: "22 Jun 2026", analysisType: "Doubles", coach: "Coach Dan", rating: 86, comment: "Excellent net coverage. Work the I-formation cue and you'll dominate the middle." },
      { id: "r2", date: "09 Jun 2026", analysisType: "Backhand", coach: "Coach Marta", rating: 88, comment: "Beautiful, clean strike. Nothing to fix — keep loading it the same way." },
      { id: "r3", date: "28 May 2026", analysisType: "Serve", coach: "Coach Dan", rating: 79, comment: "Add a little more knee bend for extra kick on the second serve." },
    ],
    coachNote: { coach: "Coach Dan", text: "Priya is our most complete all-court player. The backhand is a genuine weapon — now we're building the serve to give her free points." },
    achievements: baseAchievements(["first", "five", "streak", "serve80", "allcourt"]),
  },
  {
    slug: "marcus-delaney",
    name: "Marcus Delaney",
    initials: "MD",
    membershipId: "MPC-2298",
    level: "Intermediate · NTRP 3.5",
    hand: "Left-handed",
    favouriteShot: "Serve",
    joined: "Mar 2025",
    tier: "Standard",
    overall: 69,
    ratings: [
      { key: "serve", label: "Serve", value: 78 },
      { key: "forehand", label: "Forehand", value: 70 },
      { key: "backhand", label: "Backhand", value: 62 },
      { key: "volley", label: "Volley", value: 66 },
    ],
    goals: [
      { id: "g1", title: "Steady the backhand wing", detail: "Fewer errors under pace", progress: 45 },
      { id: "g2", title: "Improve court movement", detail: "Earlier split-step", progress: 50 },
    ],
    reviews: [
      { id: "r1", date: "18 Jun 2026", analysisType: "Match Play", coach: "Coach Marta", rating: 68, comment: "Lefty serve is a real advantage — use it wide on the ad side more often." },
      { id: "r2", date: "01 Jun 2026", analysisType: "Backhand", coach: "Coach Dan", rating: 62, comment: "Take a slightly shorter backswing and you'll meet the ball out front more reliably." },
    ],
    coachNote: { coach: "Coach Marta", text: "Marcus's left-handed serve already causes problems. Tightening the backhand is the fastest route to the next level for him." },
    achievements: baseAchievements(["first", "five"]),
  },
  {
    slug: "elena-kovac",
    name: "Elena Kovač",
    initials: "EK",
    membershipId: "MPC-1902",
    level: "Advanced · NTRP 4.0",
    hand: "Right-handed",
    favouriteShot: "Volley",
    joined: "Feb 2025",
    tier: "Elite",
    overall: 77,
    ratings: [
      { key: "serve", label: "Serve", value: 74 },
      { key: "forehand", label: "Forehand", value: 79 },
      { key: "backhand", label: "Backhand", value: 75 },
      { key: "volley", label: "Volley", value: 84 },
    ],
    goals: [
      { id: "g1", title: "Build a bigger first serve", detail: "More free points", progress: 58 },
      { id: "g2", title: "Stay calm on big points", detail: "Trust the routine", progress: 65 },
    ],
    reviews: [
      { id: "r1", date: "20 Jun 2026", analysisType: "Volley", coach: "Coach Dan", rating: 84, comment: "Soft hands are superb. You're ready to attack the net far more often." },
      { id: "r2", date: "04 Jun 2026", analysisType: "Mental Performance", coach: "Coach Marta", rating: 72, comment: "Your reset routine is solid — add a breathing cue between points." },
    ],
    coachNote: { coach: "Coach Dan", text: "Elena volleys like a doubles specialist. If she builds the serve to get to net on her terms, she'll be a nightmare to pass." },
    achievements: baseAchievements(["first", "five", "streak"]),
  },
  {
    slug: "tom-rutherford",
    name: "Tom Rutherford",
    initials: "TR",
    membershipId: "MPC-2055",
    level: "Improver · NTRP 3.0",
    hand: "Right-handed",
    favouriteShot: "Forehand",
    joined: "Apr 2025",
    tier: "Standard",
    overall: 61,
    ratings: [
      { key: "serve", label: "Serve", value: 58 },
      { key: "forehand", label: "Forehand", value: 68 },
      { key: "backhand", label: "Backhand", value: 55 },
      { key: "volley", label: "Volley", value: 60 },
    ],
    goals: [
      { id: "g1", title: "Get first serves in", detail: "Rhythm over power", progress: 40 },
      { id: "g2", title: "Rally with margin", detail: "Aim higher over the net", progress: 48 },
    ],
    reviews: [
      { id: "r1", date: "16 Jun 2026", analysisType: "Forehand", coach: "Coach Marta", rating: 68, comment: "Lovely natural swing. Finish higher over the shoulder for more margin." },
      { id: "r2", date: "30 May 2026", analysisType: "Serve", coach: "Coach Dan", rating: 56, comment: "Slow the motion down and let the toss settle — accuracy first, pace later." },
    ],
    coachNote: { coach: "Coach Marta", text: "Tom has improved quickly since joining. The forehand is a lovely base to build the rest of his game around." },
    achievements: baseAchievements(["first"]),
  },
  {
    slug: "aisha-bello",
    name: "Aisha Bello",
    initials: "AB",
    membershipId: "MPC-2310",
    level: "Intermediate · NTRP 3.5",
    hand: "Right-handed",
    favouriteShot: "Serve",
    joined: "May 2025",
    tier: "Elite",
    overall: 72,
    ratings: [
      { key: "serve", label: "Serve", value: 80 },
      { key: "forehand", label: "Forehand", value: 72 },
      { key: "backhand", label: "Backhand", value: 66 },
      { key: "volley", label: "Volley", value: 70 },
    ],
    goals: [
      { id: "g1", title: "Add a kick second serve", detail: "Safer, heavier action", progress: 62 },
      { id: "g2", title: "Come forward with intent", detail: "Back the volley", progress: 44 },
    ],
    reviews: [
      { id: "r1", date: "30 Jun 2026", analysisType: "Serve", coach: "Coach Dan", rating: 80, comment: "Flat serve is excellent. Now let's add the kick for a reliable second." },
      { id: "r2", date: "12 Jun 2026", analysisType: "Backhand", coach: "Coach Marta", rating: 66, comment: "Rotate the shoulders a little more and the backhand will free up nicely." },
    ],
    coachNote: { coach: "Coach Dan", text: "Aisha's first serve is already a weapon. A dependable second serve will let her play the big points with total freedom." },
    achievements: baseAchievements(["first", "five", "serve80"]),
  },
];

/** Look up a member by slug. Returns undefined for unknown slugs. */
export function getMemberBySlug(slug: string): Member | undefined {
  return MEMBERS.find((m) => m.slug === slug);
}

/**
 * The signed-in member's profile slug — placeholder until auth lands.
 * The member portal's "My profile" resolves to this and nothing else, so
 * members never see the wider roster. Wire to the real session later.
 */
export const MY_PROFILE_SLUG = "henry-macdonald";
