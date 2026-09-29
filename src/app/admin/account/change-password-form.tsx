"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, KeyRound } from "lucide-react";
import { changePasswordAction } from "@/app/admin/actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/ui/toast";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <KeyRound className="h-4 w-4" />}
      {pending ? "Updating…" : "Update password"}
    </Button>
  );
}

export function ChangePasswordForm({ mustChangePassword }: { mustChangePassword: boolean }) {
  const [state, formAction] = useActionState(changePasswordAction, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="brand-card flex flex-col gap-4 rounded-xl p-6">
      {mustChangePassword ? (
        <p className="rounded-lg border-2 border-goldenrod bg-goldenrod/20 px-4 py-2.5 text-sm font-medium text-ink">
          You&apos;re using a temporary password — set your own now.
        </p>
      ) : null}
      <div>
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
        {errors?.currentPassword ? <p className="field-error">{errors.currentPassword}</p> : null}
      </div>
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
        {errors?.newPassword ? <p className="field-error">{errors.newPassword}</p> : null}
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
        {errors?.confirmPassword ? <p className="field-error">{errors.confirmPassword}</p> : null}
      </div>
      <ActionFeedback state={state && state.message ? { ok: state.ok, message: state.message } : null} />
      <Submit />
    </form>
  );
}
