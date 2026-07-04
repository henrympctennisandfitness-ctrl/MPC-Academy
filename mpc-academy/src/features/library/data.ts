import {
  Zap,
  Target,
  Shuffle,
  Dumbbell,
  Apple,
  Brain,
  Swords,
  Map as MapIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * Coaching Library — categories + video catalogue.
 * In-memory for now (mirrors the coach feature). The "video" is a placeholder;
 * swap in real thumbnails/URLs when the media pipeline is ready.
 */

export interface Category {
  slug: string;
  label: string;
  icon: LucideIcon;
  gradient: string; // thumbnail wash
}

export interface Video {
  id: string;
  title: string;
  category: string; // Category slug
  duration: string;
  coach: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { slug: "serve", label: "Serve", icon: Zap, gradient: "linear-gradient(135deg,#0E4D3A,#1c6d53)" },
  { slug: "forehand", label: "Forehand", icon: Target, gradient: "linear-gradient(135deg,#125e46,#2a7d63)" },
  { slug: "backhand", label: "Backhand", icon: Shuffle, gradient: "linear-gradient(135deg,#0A3B2C,#14624a)" },
  { slug: "fitness", label: "Fitness", icon: Dumbbell, gradient: "linear-gradient(135deg,#7a5c1f,#a67c2e)" },
  { slug: "nutrition", label: "Nutrition", icon: Apple, gradient: "linear-gradient(135deg,#3d5a3a,#5f8a56)" },
  { slug: "mental", label: "Mental", icon: Brain, gradient: "linear-gradient(135deg,#2f3a4a,#4a5a72)" },
  { slug: "match-play", label: "Match Play", icon: Swords, gradient: "linear-gradient(135deg,#1a3a2e,#0E4D3A)" },
  { slug: "tactics", label: "Tactics", icon: MapIcon, gradient: "linear-gradient(135deg,#2b2f33,#454b52)" },
];

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

export const VIDEOS: Video[] = [
  // Serve
  { id: "serve-1", title: "The kinetic chain, unpacked", category: "serve", duration: "8 min", coach: "Coach Marta", description: "How power flows from the ground up — and where most club players leak it." },
  { id: "serve-2", title: "Building a reliable toss", category: "serve", duration: "6 min", coach: "Coach Dan", description: "A repeatable toss is the foundation of a repeatable serve. Here's the drill." },
  { id: "serve-3", title: "Adding kick to your second serve", category: "serve", duration: "11 min", coach: "Coach Marta", description: "Grip, brush and follow-through for a heavy, safe second serve." },
  // Forehand
  { id: "forehand-1", title: "Finding your natural window", category: "forehand", duration: "7 min", coach: "Coach Dan", description: "Contact point mapping so you meet the ball where you're strongest." },
  { id: "forehand-2", title: "Heavy topspin, same effort", category: "forehand", duration: "9 min", coach: "Coach Marta", description: "Racket-head speed and low-to-high shape without swinging harder." },
  { id: "forehand-3", title: "The running forehand", category: "forehand", duration: "6 min", coach: "Coach Dan", description: "Stay balanced and reset the point when you're pulled wide." },
  // Backhand
  { id: "backhand-1", title: "One-hander vs two-hander", category: "backhand", duration: "10 min", coach: "Coach Marta", description: "Choosing the backhand that fits your game — and committing to it." },
  { id: "backhand-2", title: "The slice that stays low", category: "backhand", duration: "7 min", coach: "Coach Dan", description: "Racket-face control and finish for a slice that skids through." },
  { id: "backhand-3", title: "Taking the backhand early", category: "backhand", duration: "8 min", coach: "Coach Marta", description: "Rob your opponent of time by catching the ball on the rise." },
  // Fitness
  { id: "fitness-1", title: "Court-specific mobility", category: "fitness", duration: "14 min", coach: "Coach Dan", description: "A pre-hit routine that opens the hips and protects the shoulder." },
  { id: "fitness-2", title: "Explosive first-step speed", category: "fitness", duration: "12 min", coach: "Coach Marta", description: "Split-step timing and loading drills for a faster first move." },
  { id: "fitness-3", title: "Recovery for match weeks", category: "fitness", duration: "9 min", coach: "Coach Dan", description: "How to back up performance day after day without breaking down." },
  // Nutrition
  { id: "nutrition-1", title: "Fuelling a three-setter", category: "nutrition", duration: "6 min", coach: "Coach Marta", description: "What to eat before and during a long match to hold your level." },
  { id: "nutrition-2", title: "Hydration that works", category: "nutrition", duration: "5 min", coach: "Coach Dan", description: "Electrolytes, timing and the signs you've already fallen behind." },
  { id: "nutrition-3", title: "Eating between matches", category: "nutrition", duration: "7 min", coach: "Coach Marta", description: "Fast, practical refuelling for tournament and double-header days." },
  // Mental
  { id: "mental-1", title: "Resetting between points", category: "mental", duration: "7 min", coach: "Coach Dan", description: "A 15-second routine to let go of the last point and refocus." },
  { id: "mental-2", title: "Playing the big points", category: "mental", duration: "9 min", coach: "Coach Marta", description: "Decision-making and nerves when the score tightens up." },
  { id: "mental-3", title: "Your pre-serve routine", category: "mental", duration: "6 min", coach: "Coach Dan", description: "Anchor your serve with a routine that travels to match day." },
  // Match Play
  { id: "match-play-1", title: "Closing out a set", category: "match-play", duration: "10 min", coach: "Coach Marta", description: "Serving for it: patterns and mindset to get over the line." },
  { id: "match-play-2", title: "Reading your opponent", category: "match-play", duration: "8 min", coach: "Coach Dan", description: "Spot tendencies early and build a game plan on the fly." },
  { id: "match-play-3", title: "Tie-break tactics", category: "match-play", duration: "7 min", coach: "Coach Marta", description: "Percentage plays for the moments that decide matches." },
  // Tactics
  { id: "tactics-1", title: "Patterns off the serve", category: "tactics", duration: "9 min", coach: "Coach Dan", description: "Serve-plus-one combinations that put you on the front foot." },
  { id: "tactics-2", title: "Constructing the point", category: "tactics", duration: "8 min", coach: "Coach Marta", description: "Open the court step by step instead of forcing the winner." },
  { id: "tactics-3", title: "Doubles positioning", category: "tactics", duration: "10 min", coach: "Coach Dan", description: "Movement as a pair — poaching, switching and covering." },
];
