import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("brand-card rounded-xl p-5", className)}>
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}
