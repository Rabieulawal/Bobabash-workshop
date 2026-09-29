"use client";

import { CupSoda } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-6">
      <div className="brand-card max-w-md rounded-xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-line bg-destructive/15">
          <CupSoda className="h-8 w-8 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Something spilled…</h1>
        <p className="mt-2 text-sm text-ink-muted">
          An unexpected error occurred. Please try again — if it keeps happening, the organizers have been notified.
        </p>
        {error.digest ? <p className="mt-2 font-mono text-xs text-ink-soft">Ref: {error.digest}</p> : null}
        <Button className="mt-5" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
