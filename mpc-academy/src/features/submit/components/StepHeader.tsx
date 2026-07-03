interface StepHeaderProps {
  title: string;
  subtitle?: string;
}

/** Title + supporting line shared by every wizard step. */
export function StepHeader({ title, subtitle }: StepHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-[26px] font-bold leading-tight tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">
          {subtitle}
        </p>
      )}
    </div>
  );
}
