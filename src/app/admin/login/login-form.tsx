"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, LogIn } from "lucide-react";
import { loginAction } from "@/app/admin/actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <LogIn className="h-4 w-4" />}
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required autoFocus placeholder="e.g. ahmed" />
      {state && !state.ok && state.fieldErrors?.username ? (
        <p className="field-error">{state.fieldErrors.username}</p>
      ) : null}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        {state && !state.ok && state.fieldErrors?.password ? <p className="field-error">{state.fieldErrors.password}</p> : null}
      </div>
      {state && !state.ok ? (
        <p role="alert" className="rounded-lg border-2 border-[#7c2d1f] bg-destructive/15 px-4 py-2.5 text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
