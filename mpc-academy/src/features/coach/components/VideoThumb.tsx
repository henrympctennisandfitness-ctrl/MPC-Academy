import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Placeholder video tile (no real player yet). A calm green wash with a
 * play affordance; `size` switches between the card thumbnail and the drawer.
 */
export function VideoThumb({
  size = "card",
  onClick,
}: {
  size?: "card" | "full";
  onClick?: () => void;
}) {
  const full = size === "full";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Play video"
      className={cn(
        "group relative grid place-items-center overflow-hidden rounded-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        full ? "aspect-video w-full" : "aspect-video w-28 shrink-0 sm:w-32",
      )}
      style={{
        background:
          "linear-gradient(135deg, #0E4D3A 0%, #14624a 55%, #1c6d53 100%)",
      }}
    >
      <span
        className={cn(
          "grid place-items-center rounded-full bg-white/95 text-brand shadow-sm transition-transform group-hover:scale-105",
          full ? "h-14 w-14" : "h-8 w-8",
        )}
      >
        <Play size={full ? 22 : 14} className="ml-0.5" fill="currentColor" />
      </span>
    </button>
  );
}
