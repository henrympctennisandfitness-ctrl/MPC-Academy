import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  size?: "md" | "lg";
  className?: string;
}

/**
 * Initials avatar on a calm brand wash. `image` support can be layered in later
 * via next/image; initials are the private-club default.
 */
export function Avatar({ initials, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold text-white",
        size === "lg" ? "h-20 w-20 text-2xl" : "h-11 w-11 text-sm",
        className,
      )}
      style={{ background: "linear-gradient(135deg,#0E4D3A,#1c6d53)" }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
