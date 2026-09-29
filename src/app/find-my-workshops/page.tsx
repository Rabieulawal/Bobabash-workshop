"use client";

import { useActionState } from "react";
import { MailSearch, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resendAccessAction } from "@/app/workshops/actions/registration-actions";

export default function FindMyWorkshopsPage() {
  const [state, formAction, pending] = useActionState(resendAccessAction, null);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="container max-w-lg py-16">
          <div className="brand-card rounded-xl p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-bubble-ink bg-bubble">
              <MailSearch className="h-7 w-7 text-bubble-ink" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-center font-display text-2xl font-bold text-ink">Find my workshops</h1>
            <p className="mt-2 text-center text-sm text-ink-muted">
              Enter the email you registered with and we&apos;ll send you fresh, secure links to all your upcoming workshops.
            </p>
            <form action={formAction} className="mt-6 flex flex-col gap-3">
              <Input type="email" name="email" required placeholder="you@example.com" aria-label="Email address" autoComplete="email" />
              <Button type="submit" disabled={pending} size="lg">
                {pending ? (
                  <>
                    <Loader2 className="animate-spin" /> Sending…
                  </>
                ) : (
                  "Email me my links"
                )}
              </Button>
            </form>
            {state ? (
              <p
                role="status"
                className={`mt-4 rounded-lg border-2 px-4 py-3 text-sm font-medium ${
                  state.ok ? "border-[#5b8f64] bg-mint/50 text-[#2c5533]" : "border-[#7c2d1f] bg-destructive/15 text-destructive"
                }`}
              >
                {state.message}
              </p>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
