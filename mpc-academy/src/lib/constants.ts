import {
  Home,
  Upload,
  TrendingUp,
  BookOpen,
  User,
  Trophy,
  CalendarDays,
  Gift,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Primary destinations. These appear in the mobile bottom bar (max 5) and at
 * the top of the desktop sidebar.
 */
export const PRIMARY_NAV: NavItem[] = [
  { id: "home", label: "Home", href: "/", icon: Home },
  { id: "submit", label: "Submit", href: "/submit", icon: Upload },
  { id: "progress", label: "Progress", href: "/progress", icon: TrendingUp },
  { id: "library", label: "Library", href: "/library", icon: BookOpen },
  { id: "settings", label: "You", href: "/settings", icon: User },
];

/**
 * Secondary destinations. Desktop sidebar only; on mobile they are reached from
 * dashboard cards.
 */
export const SECONDARY_NAV: NavItem[] = [
  { id: "challenge", label: "Monthly Challenge", href: "/challenge", icon: Trophy },
  { id: "events", label: "Academy Events", href: "/events", icon: CalendarDays },
  { id: "benefits", label: "Member Benefits", href: "/benefits", icon: Gift },
];
