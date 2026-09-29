"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Loader2, KeyRound, Pencil, Power } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ActionState } from "@/lib/action-utils";
import {
  createOrganizerAction,
  updateOrganizerAction,
  resetOrganizerPasswordAction,
  setOrganizerActiveAction,
} from "@/app/admin/actions/admin-actions";

function Submit({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "destructive" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant}>
      {pending ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}

function Errors({ state }: { state: ActionState | null }) {
  if (!state) return null;
  if (state.ok) {
    return <p role="status" className="rounded-lg border-2 border-[#5b8f64] bg-mint/50 px-4 py-2.5 text-sm font-medium text-[#2c5533]">{state.message}</p>;
  }
  return (
    <>
      {state.message ? <p role="alert" className="text-sm font-medium text-destructive">{state.message}</p> : null}
      {state.fieldErrors ? (
        <ul className="text-sm text-destructive">
          {Object.entries(state.fieldErrors).map(([k, v]) => (
            <li key={k}>{k}: {v}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

const PERMISSION_OPTIONS = [
  { value: "workshops:manage-all", label: "Manage all workshops" },
  { value: "registrations:manage-all", label: "Manage all registrations" },
  { value: "organizations:manage", label: "Manage organizations" },
  { value: "stats:view", label: "View statistics" },
];

export function CreateOrganizerDialog({ organizations }: { organizations: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState(createOrganizerAction, null);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> New organizer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create organizer</DialogTitle>
          <DialogDescription>
            Share the username and initial password privately. They&apos;ll be asked to change it on first login.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="org-name">Full name</Label>
            <Input id="org-name" name="name" required placeholder="e.g. Ahmed Raza" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="org-username">Username</Label>
              <Input id="org-username" name="username" required placeholder="ahmed" pattern="[a-zA-Z0-9._-]+" />
            </div>
            <div>
              <Label htmlFor="org-password">Initial password</Label>
              <Input id="org-password" name="password" type="text" required minLength={8} placeholder="min 8 characters" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="org-role">Role</Label>
              <Select id="org-role" name="role" defaultValue="ORGANIZER">
                <option value="ORGANIZER">Organizer</option>
                <option value="WORKSHOP_MANAGER">Workshop manager</option>
                <option value="SUPER_ADMIN">Super admin</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="org-org">Organization</Label>
              <Select id="org-org" name="organizationId" defaultValue="">
                <option value="">— none (admins don&apos;t need one) —</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <Errors state={state} />
          <DialogFooter>
            <Submit><Plus className="h-4 w-4" /> Create organizer</Submit>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditOrganizerDialog({
  organizer,
  organizations,
}: {
  organizer: {
    id: string; name: string; username: string; role: string;
    organizationId: string | null; permissions: string[]; active: boolean;
  };
  organizations: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(updateOrganizerAction, null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Edit ${organizer.username}`}><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit @{organizer.username}</DialogTitle>
          <DialogDescription>Update role, organization, permissions or active state.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={organizer.id} />
          <div>
            <Label htmlFor={`name-${organizer.id}`}>Full name</Label>
            <Input id={`name-${organizer.id}`} name="name" required defaultValue={organizer.name} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`username-${organizer.id}`}>Username</Label>
              <Input id={`username-${organizer.id}`} name="username" required defaultValue={organizer.username} pattern="[a-zA-Z0-9._-]+" />
            </div>
            <div>
              <Label htmlFor={`role-${organizer.id}`}>Role</Label>
              <Select id={`role-${organizer.id}`} name="role" defaultValue={organizer.role}>
                <option value="ORGANIZER">Organizer</option>
                <option value="WORKSHOP_MANAGER">Workshop manager</option>
                <option value="SUPER_ADMIN">Super admin</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor={`orgsel-${organizer.id}`}>Organization</Label>
            <Select id={`orgsel-${organizer.id}`} name="organizationId" defaultValue={organizer.organizationId ?? ""}>
              <option value="">— none —</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Select>
          </div>
          <fieldset>
            <Label asChild>
              <span>Extra permissions</span>
            </Label>
            <div className="mt-1 flex flex-col gap-1.5">
              {PERMISSION_OPTIONS.map((p) => (
                <label key={p.value} className="flex items-center gap-2 text-sm text-ink-muted">
                  <input
                    type="checkbox"
                    name="permissions"
                    value={p.value}
                    defaultChecked={organizer.permissions.includes(p.value)}
                    className="h-4 w-4 rounded border-2 border-line accent-[#274156]"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2.5 text-sm text-ink-muted">
            <input type="checkbox" name="active" defaultChecked={organizer.active} className="h-4 w-4 accent-[#274156]" />
            Active (can sign in)
          </label>
          <Errors state={state} />
          <DialogFooter>
            <Submit><Pencil className="h-4 w-4" /> Save changes</Submit>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ResetPasswordDialog({ organizerId, username }: { organizerId: string; username: string }) {
  const [state, formAction] = useActionState(resetOrganizerPasswordAction, null);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Reset password for ${username}`}><KeyRound className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for @{username}</DialogTitle>
          <DialogDescription>
            All their active sessions will be signed out immediately.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="organizerId" value={organizerId} />
          <div>
            <Label htmlFor={`newpw-${organizerId}`}>New password</Label>
            <Input id={`newpw-${organizerId}`} name="newPassword" type="text" required minLength={8} placeholder="min 8 characters" />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-ink-muted">
            <input type="checkbox" name="mustChangePassword" defaultChecked className="h-4 w-4 accent-[#274156]" />
            Ask them to change it at next login
          </label>
          <Errors state={state} />
          <DialogFooter>
            <Submit><KeyRound className="h-4 w-4" /> Reset password</Submit>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ToggleActiveButton({ organizerId, active, username }: { organizerId: string; active: boolean; username: string }) {
  const [state, formAction] = useActionState(setOrganizerActiveAction, null);
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="organizerId" value={organizerId} />
      <input type="hidden" name="active" value={(!active).toString()} />
      <Button variant="ghost" size="sm" type="submit" aria-label={active ? `Disable ${username}` : `Enable ${username}`} title={state?.message}>
        <Power className={`h-4 w-4 ${active ? "" : "text-[#5b8f64]"}`} />
      </Button>
    </form>
  );
}
