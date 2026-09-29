"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Loader2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-utils";
import { createOrganizationAction, updateOrganizationAction } from "@/app/admin/actions/admin-actions";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}

function Errors({ state }: { state: ActionState | null }) {
  if (!state) return null;
  if (state.ok) {
    return <p role="status" className="rounded-lg border-2 border-[#5b8f64] bg-mint/50 px-4 py-2.5 text-sm font-medium text-[#2c5533]">{state.message}</p>;
  }
  return <p role="alert" className="text-sm font-medium text-destructive">{state.message}</p>;
}

export function CreateOrganizationDialog() {
  const [state, formAction] = useActionState(createOrganizationAction, null);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> New organization</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create organization / event</DialogTitle>
          <DialogDescription>
            e.g. Lahore Coding Club, Lahore AI Meetup, School Tech Society. Leave &quot;Boba Bash ecosystem&quot; unchecked for partner orgs.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="new-org-name">Name</Label>
            <Input id="new-org-name" name="name" required placeholder="e.g. Lahore Coding Club" />
          </div>
          <div>
            <Label htmlFor="new-org-desc">Description</Label>
            <Textarea id="new-org-desc" name="description" rows={3} placeholder="What does this organization do?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-org-status">Status</Label>
              <Select id="new-org-status" name="status" defaultValue="ACTIVE">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
            <label className="mt-6 flex items-center gap-2.5 text-sm text-ink-muted">
              <input type="checkbox" name="isFeatured" className="h-4 w-4 accent-[#274156]" />
              Boba Bash ecosystem (featured)
            </label>
          </div>
          <Errors state={state} />
          <DialogFooter>
            <Submit><Plus className="h-4 w-4" /> Create</Submit>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditOrganizationDialog({
  organization,
}: {
  organization: { id: string; name: string; description: string | null; isFeatured: boolean; status: string };
}) {
  const [state, formAction] = useActionState(updateOrganizationAction, null);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Edit ${organization.name}`}><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {organization.name}</DialogTitle>
          <DialogDescription>The slug/URL never changes once created.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={organization.id} />
          <div>
            <Label htmlFor={`org-name-${organization.id}`}>Name</Label>
            <Input id={`org-name-${organization.id}`} name="name" required defaultValue={organization.name} />
          </div>
          <div>
            <Label htmlFor={`org-desc-${organization.id}`}>Description</Label>
            <Textarea id={`org-desc-${organization.id}`} name="description" rows={3} defaultValue={organization.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`org-status-${organization.id}`}>Status</Label>
              <Select id={`org-status-${organization.id}`} name="status" defaultValue={organization.status}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
            <label className="mt-6 flex items-center gap-2.5 text-sm text-ink-muted">
              <input type="checkbox" name="isFeatured" defaultChecked={organization.isFeatured} className="h-4 w-4 accent-[#274156]" />
              Boba Bash ecosystem (featured)
            </label>
          </div>
          <Errors state={state} />
          <DialogFooter>
            <Submit><Pencil className="h-4 w-4" /> Save changes</Submit>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
