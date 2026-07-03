import {
  Zap,
  Target,
  Shuffle,
  ArrowUpRight,
  Scissors,
  Swords,
  Users,
  Brain,
  MoreHorizontal,
  Repeat,
  Flame,
  Crosshair,
  Footprints,
  RotateCw,
  Sparkles,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface Option {
  value: string;
  label: string;
  icon: LucideIcon;
}

/** Step 1 — what shot or area to analyse. */
export const ANALYSIS_TYPES: Option[] = [
  { value: "Serve", label: "Serve", icon: Zap },
  { value: "Forehand", label: "Forehand", icon: Target },
  { value: "Backhand", label: "Backhand", icon: Shuffle },
  { value: "Volley", label: "Volley", icon: ArrowUpRight },
  { value: "Slice", label: "Slice", icon: Scissors },
  { value: "Match Play", label: "Match Play", icon: Swords },
  { value: "Doubles", label: "Doubles", icon: Users },
  { value: "Mental Performance", label: "Mental Performance", icon: Brain },
  { value: "Other", label: "Other", icon: MoreHorizontal },
];

/** Step 2 — the coaching goal for this clip. */
export const COACHING_GOALS: Option[] = [
  { value: "Consistency", label: "Consistency", icon: Repeat },
  { value: "Power", label: "Power", icon: Flame },
  { value: "Technique", label: "Technique", icon: Crosshair },
  { value: "Footwork", label: "Footwork", icon: Footprints },
  { value: "Spin", label: "Spin", icon: RotateCw },
  { value: "Confidence", label: "Confidence", icon: Sparkles },
  { value: "Match Tactics", label: "Match Tactics", icon: ClipboardList },
  { value: "Other", label: "Other", icon: MoreHorizontal },
];

export const ANALYSIS_VALUES = ANALYSIS_TYPES.map((o) => o.value);
export const GOAL_VALUES = COACHING_GOALS.map((o) => o.value);
