import { getCurrentUser, roleTitle } from "@/lib/access";

/**
 * Development-only badge showing which mock user is active, e.g.
 * "Viewing as Henry Macdonald · Admin". Hidden in production, and easy to
 * remove entirely once real auth is in place.
 */
export function DevRoleIndicator() {
  if (process.env.NODE_ENV === "production") return null;

  const user = getCurrentUser();
  return (
    <div className="fixed bottom-20 left-3 z-50 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-[11px] font-medium text-muted shadow-card backdrop-blur lg:bottom-3">
      Viewing as <span className="text-ink">{user.name}</span> ·{" "}
      {roleTitle(user.role)}
    </div>
  );
}
