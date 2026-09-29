"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Minimal action feedback banner (no external toast lib). */
export function ActionFeedback({
  state,
  className,
}: {
  state: { ok: boolean; message?: string } | null;
  className?: string;
}) {
  if (!state || !state.message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium animate-fade-up",
        state.ok ? "border-[#5b8f64] bg-mint/50 text-[#2c5533]" : "border-[#7c2d1f] bg-destructive/15 text-destructive",
        className,
      )}
    >
      {state.ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>{state.message}</span>
    </div>
  );
}
