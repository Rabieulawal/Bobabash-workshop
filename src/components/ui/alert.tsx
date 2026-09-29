import * as React from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "danger";

const styles: Record<AlertVariant, string> = {
  info: "border-bubble-ink bg-bubble/40 text-bubble-ink",
  success: "border-[#5b8f64] bg-mint/50 text-[#2c5533]",
  warning: "border-line bg-goldenrod/40 text-ink",
  danger: "border-[#7c2d1f] bg-destructive/15 text-destructive",
};

export function Alert({
  className,
  variant = "info",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      role="alert"
      className={cn("rounded-lg border-2 px-4 py-3 text-sm font-medium", styles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
