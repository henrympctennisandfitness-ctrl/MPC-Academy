import {
  Inbox,
  Clock3,
  CheckCircle2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SubmissionStatus } from "./data";

export interface CoachNavItem {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
}

/** Left sidebar (desktop) + bottom bar (mobile) share this. */
export const COACH_NAV: CoachNavItem[] = [
  { id: "today", label: "Today's Queue", shortLabel: "Today", href: "/coach", icon: Inbox },
  { id: "pending", label: "Pending Reviews", shortLabel: "Pending", href: "/coach/pending", icon: Clock3 },
  { id: "completed", label: "Completed", shortLabel: "Done", href: "/coach/completed", icon: CheckCircle2 },
  { id: "members", label: "Members", shortLabel: "Members", href: "/coach/members", icon: Users },
];

/** Visual treatment per status. Kept as inline colours to stay off-palette-safe. */
export const STATUS_STYLE: Record<
  SubmissionStatus,
  { bg: string; fg: string; dot: string }
> = {
  New: { bg: "#FBF6E7", fg: "#8A6D12", dot: "#D4AF37" },
  "In Review": { bg: "#EAF1EE", fg: "#0E4D3A", dot: "#0E4D3A" },
  Completed: { bg: "#E7F3EC", fg: "#146C43", dot: "#1F9D57" },
};

export const ANALYSIS_FILTERS = [
  "All",
  "Serve",
  "Forehand",
  "Backhand",
  "Volley",
  "Slice",
  "Match Play",
  "Doubles",
  "Mental Performance",
];
