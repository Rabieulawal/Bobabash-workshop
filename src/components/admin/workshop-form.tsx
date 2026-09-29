"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ActionState } from "@/lib/action-utils";

export type WorkshopFormValues = {
  id?: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  format: "ONLINE" | "IN_PERSON";
  location: string | null;
  capacity: number | null;
  meetingUrl: string | null;
  coverImageUrl: string | null;
  status: string;
  organizationId: string;
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function WorkshopForm({
  action,
  values,
  organizations,
  submitLabel,
  isSuperAdmin,
}: {
  action: (state: ActionState | null, formData: FormData) => Promise<ActionState>;
  values: Partial<WorkshopFormValues>;
  organizations: { id: string; name: string; isFeatured: boolean }[];
  submitLabel: string;
  isSuperAdmin: boolean;
}) {
  const [state, formAction] = useActionState(action, null);

  const org = useMemo(
    () => organizations.find((o) => o.id === (values.organizationId ?? organizations[0]?.id)),
    [organizations, values.organizationId],
  );

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state && !state.ok && state.message ? (
        <p role="alert" className="rounded-lg border-2 border-[#7c2d1f] bg-destructive/15 px-4 py-3 text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}

      <fieldset className="brand-card flex flex-col gap-5 rounded-xl p-6">
        <legend className="sr-only">Workshop details</legend>
        <div>
          <Label htmlFor="title">Workshop name *</Label>
          <Input id="title" name="title" required defaultValue={values.title ?? ""} placeholder="e.g. Intro to Boba Brewing" aria-required="true" />
          {fieldErrors?.title ? <p className="field-error">{fieldErrors.title}</p> : null}
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            name="description"
            required
            rows={6}
            defaultValue={values.description ?? ""}
            placeholder="What will attendees learn? What should they bring?"
            aria-required="true"
          />
          {fieldErrors?.description ? <p className="field-error">{fieldErrors.description}</p> : null}
        </div>

        <div>
          <Label htmlFor="coverImageUrl">Cover image URL (optional)</Label>
          <Input id="coverImageUrl" name="coverImageUrl" type="url" placeholder="https://…" defaultValue={values.coverImageUrl ?? ""} />
          <p className="mt-1 text-xs text-ink-soft">Must be an https:// image URL (use your own image host or CDN).</p>
          {fieldErrors?.coverImageUrl ? <p className="field-error">{fieldErrors.coverImageUrl}</p> : null}
        </div>
      </fieldset>

      <fieldset className="brand-card flex flex-col gap-5 rounded-xl p-6">
        <legend className="sr-only">Schedule and format</legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input id="date" name="date" type="date" required defaultValue={values.date ?? ""} aria-required="true" />
            {fieldErrors?.date ? <p className="field-error">{fieldErrors.date}</p> : null}
          </div>
          <div>
            <Label htmlFor="startTime">Start time *</Label>
            <Input id="startTime" name="startTime" type="time" required defaultValue={values.startTime ?? ""} aria-required="true" />
            {fieldErrors?.startTime ? <p className="field-error">{fieldErrors.startTime}</p> : null}
          </div>
          <div>
            <Label htmlFor="endTime">End time *</Label>
            <Input id="endTime" name="endTime" type="time" required defaultValue={values.endTime ?? ""} aria-required="true" />
            {fieldErrors?.endTime ? <p className="field-error">{fieldErrors.endTime}</p> : null}
          </div>
        </div>
        <p className="text-xs text-ink-soft">Times are in Pakistan Standard Time (Lahore).</p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="format">Format *</Label>
            <Select id="format" name="format" defaultValue={values.format ?? "IN_PERSON"}>
              <option value="IN_PERSON">In person</option>
              <option value="ONLINE">Online</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="location">Location (for in-person)</Label>
            <Input id="location" name="location" defaultValue={values.location ?? ""} placeholder="e.g. Boba Bash HQ, Gulberg, Lahore" />
            {fieldErrors?.location ? <p className="field-error">{fieldErrors.location}</p> : null}
          </div>
        </div>
      </fieldset>

      <fieldset className="brand-card flex flex-col gap-5 rounded-xl p-6">
        <legend className="sr-only">Capacity and links</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="capacity">Maximum attendees (optional)</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              inputMode="numeric"
              defaultValue={values.capacity ?? ""}
              placeholder="Leave empty for unlimited"
            />
            {fieldErrors?.capacity ? <p className="field-error">{fieldErrors.capacity}</p> : null}
          </div>
          <div>
            <Label htmlFor="meetingUrl">Meeting link (optional)</Label>
            <Input id="meetingUrl" name="meetingUrl" type="url" placeholder="https://meet.google.com/…" defaultValue={values.meetingUrl ?? ""} />
            <p className="mt-1 text-xs text-ink-soft">Google Meet, Zoom, Teams or any https:// link. You can add it later.</p>
            {fieldErrors?.meetingUrl ? <p className="field-error">{fieldErrors.meetingUrl}</p> : null}
          </div>
        </div>

        <div>
          <Label htmlFor="organizationId">Organization / event *</Label>
          <Select id="organizationId" name="organizationId" defaultValue={values.organizationId ?? organizations[0]?.id ?? ""} disabled={!isSuperAdmin && organizations.length === 1}>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}{o.isFeatured ? " (Boba Bash)" : ""}
              </option>
            ))}
          </Select>
          {/* Disabled selects don't submit — carry the locked value for non-admin organizers. */}
          {!isSuperAdmin && organizations.length === 1 ? (
            <input type="hidden" name="organizationId" value={organizations[0]?.id ?? ""} />
          ) : null}
          {fieldErrors?.organizationId ? <p className="field-error">{fieldErrors.organizationId}</p> : null}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={values.status ?? "DRAFT"}>
            {(values.id
              ? ["DRAFT", "PUBLISHED", "REGISTRATION_CLOSED", "FULLY_BOOKED", "CANCELLED", "COMPLETED"]
              : ["DRAFT", "PUBLISHED"]
            ).map((s) => (
              <option key={s} value={s}>
                {s === "DRAFT" && "Draft — hidden from public"}
                {s === "PUBLISHED" && "Published — registration open"}
                {s === "REGISTRATION_CLOSED" && "Registration closed"}
                {s === "FULLY_BOOKED" && "Fully booked"}
                {s === "CANCELLED" && "Cancelled"}
                {s === "COMPLETED" && "Completed"}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-ink-soft">
            {values.id ? "Attendees are notified automatically when you cancel via the workshop page." : "Start as a draft to preview, or publish right away."}
          </p>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <Submit label={submitLabel} />
        {org ? (
          <p className="text-xs text-ink-soft">
            Will appear under <span className="font-semibold text-ink">{org.name}</span>
          </p>
        ) : null}
      </div>
    </form>
  );
}

export { Switch };
