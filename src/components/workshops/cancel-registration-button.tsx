"use client";

import { useActionState } from "react";
import { XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cancelRegistrationAction } from "@/app/workshops/actions/registration-actions";

export function CancelRegistrationButton({ token }: { token: string }) {
  const [state, formAction] = useActionState(cancelRegistrationAction, null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:bg-destructive/10">
          <XCircle className="h-4 w-4" /> Cancel my registration
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel your registration?</DialogTitle>
          <DialogDescription>
            Your spot will be freed up for someone else. You can re-register any time while registration is open.
          </DialogDescription>
        </DialogHeader>
        {state?.ok ? (
          <p role="status" className="rounded-lg border-2 border-[#5b8f64] bg-mint/50 px-4 py-3 text-sm font-medium text-[#2c5533]">
            Your registration has been cancelled.
          </p>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="token" value={token} />
            {state && !state.ok ? (
              <p role="alert" className="mb-3 text-sm font-medium text-destructive">{state.message}</p>
            ) : null}
            <DialogFooter>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">Never mind</Button>
              </DialogTrigger>
              <Button type="submit" variant="destructive">Yes, cancel it</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
