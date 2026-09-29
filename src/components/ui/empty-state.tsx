import { CupSoda } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "brand-card flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-bubble-ink bg-bubble">
        <CupSoda className="h-8 w-8 text-bubble-ink" aria-hidden="true" />
      </div>
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
