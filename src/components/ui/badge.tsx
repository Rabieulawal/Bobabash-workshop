import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "bubble" | "golden" | "mint" | "danger" | "muted" | "outline";

const variants: Record<BadgeVariant, string> = {
  default: "border-line bg-surface-alt text-ink",
  bubble: "border-bubble-ink bg-bubble text-bubble-ink",
  golden: "border-line bg-goldenrod text-ink",
  mint: "border-[#5b8f64] bg-mint text-[#2c5533]",
  danger: "border-[#7c2d1f] bg-destructive text-white",
  muted: "border-line/30 bg-white text-ink-soft",
  outline: "border-line bg-transparent text-ink",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-0.5 font-display text-xs font-bold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
