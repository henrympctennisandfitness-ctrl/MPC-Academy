/**
 * Tiny className joiner. Filters out falsy values so you can do:
 *   cn("base", isActive && "active", disabled ? "opacity-50" : null)
 * Dependency-free on purpose; swap for clsx + tailwind-merge if the app grows.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
