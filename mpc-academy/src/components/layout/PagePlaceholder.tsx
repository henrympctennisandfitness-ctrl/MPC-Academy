import type { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Neutral placeholder for scaffolded routes. Every page renders one of these
 * until its feature is built, so the app is fully navigable from day one.
 */
export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: PagePlaceholderProps) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-brand-tint">
        <Icon size={28} className="text-brand" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-sm text-[15px] text-muted">{description}</p>
      <span className="mt-5 rounded-full bg-gold-tint px-3 py-1 text-xs font-semibold text-[#8A6D12]">
        Scaffolded · feature coming soon
      </span>
    </section>
  );
}
