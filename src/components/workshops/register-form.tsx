"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { PartyPopper, Loader2 } from "lucide-react";
import { registerAction } from "@/app/workshops/actions/registration-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-utils";

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending || disabled} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> Saving your spot…
        </>
      ) : (
        "I'm Going 🧋"
      )}
    </Button>
  );
}

export function RegisterForm({
  slug,
  registrationOpen,
}: {
  slug: string;
  registrationOpen: boolean;
}) {
  const [state, formAction] = useActionState(registerAction, null);

  return (
    <div className="w-full">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="slug" value={slug} />
        <Input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-label="Email address"
          className="flex-1"
        />
        <SubmitButton />
      </form>
      {state && !state.ok ? (
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? (
        <div role="status" className="mt-3 flex items-start gap-2 rounded-lg border-2 border-[#5b8f64] bg-mint/50 px-4 py-3 text-sm font-medium text-[#2c5533] animate-fade-up">
          <PartyPopper className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">You&apos;re going ✓</p>
            <p>{state.message}</p>
          </div>
        </div>
      ) : null}
      <p className="mt-2 text-xs text-ink-soft">
        No account needed — we&apos;ll email your personal workshop link.
      </p>
    </div>
  );
}
