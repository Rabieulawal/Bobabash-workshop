"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { PartyPopper, Loader2, Copy, Check, ArrowRight } from "lucide-react";
import { registerAction } from "@/app/workshops/actions/registration-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-utils";

function SubmitButton({ disabled, label }: { disabled?: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending || disabled} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> {label === "recover" ? "Checking…" : "Saving your spot…"}
        </>
      ) : label === "recover" ? (
        "Get my access link"
      ) : (
        "I'm Going 🧋"
      )}
    </Button>
  );
}

/** Copies the attendee's private access URL to the clipboard. */
function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          setCopied(false);
        }
      }}
      aria-label="Copy my access link"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" /> Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" /> Copy
        </>
      )}
    </Button>
  );
}

export function RegisterForm({
  slug,
  registrationOpen,
  variant = "register",
}: {
  slug: string;
  registrationOpen: boolean;
  /** "recover" only looks up an existing access link (used when registration is full or closed). */
  variant?: "register" | "recover";
}) {
  const [state, formAction] = useActionState(registerAction, null);
  const label = variant === "recover" ? "recover" : "register";

  return (
    <div className="w-full">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="mode" value={label} />
        <Input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-label="Email address"
          className="flex-1"
        />
        <SubmitButton label={label} />
      </form>
      {state && !state.ok ? (
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? (
        <div role="status" className="mt-3 flex items-start gap-2 rounded-lg border-2 border-[#5b8f64] bg-mint/50 px-4 py-3 text-sm font-medium text-[#2c5533] animate-fade-up">
          <PartyPopper className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">You&apos;re going ✓</p>
            <p>{state.message}</p>

            {state.attendeeUrl ? (
              <div className="mt-3 rounded-lg border-2 border-line/40 bg-surface px-3 py-3 text-ink">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                  Your private access link
                </p>
                <p className="mt-1 break-all font-mono text-xs text-ink-muted">{state.attendeeUrl}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <CopyLinkButton url={state.attendeeUrl} />
                  <Button size="sm" variant="bubble" asChild>
                    <a href={state.attendeeUrl}>
                      Open my workshop <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
                <p className="mt-2 text-xs text-ink-soft">
                  Bookmark it — this link is the only way back to your spot, so keep it to yourself.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <p className="mt-2 text-xs text-ink-soft">
        {variant === "recover"
          ? "Already registered? Enter the same email and your private access link reappears here — nothing is emailed."
          : "No account needed — your private access link appears right here after you register."}
      </p>
    </div>
  );
}
