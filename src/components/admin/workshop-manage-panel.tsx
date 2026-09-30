"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Link2, CalendarClock, PauseCircle, PlayCircle, Ban, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/ui/toast";
import type { ActionState } from "@/lib/action-utils";
import {
  setMeetingLinkAction,
  rescheduleWorkshopAction,
  setWorkshopStatusAction,
  toggleRegistrationAction,
  deleteWorkshopAction,
} from "@/app/admin/actions/workshop-actions";

function PanelSubmit({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "destructive" | "outline" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="brand-card rounded-xl p-5">
      <h3 className="mb-4 font-display text-base font-bold text-ink">{title}</h3>
      {children}
    </section>
  );
}

export function MeetingLinkPanel({ id, meetingUrl }: { id: string; meetingUrl: string | null }) {
  const [state, formAction] = useActionState(setMeetingLinkAction, null);

  return (
    <Panel title="Meeting link">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={id} />
        <div>
          <Label htmlFor="meetingUrl-panel">Meeting URL (https only)</Label>
          <Input
            id="meetingUrl-panel"
            name="meetingUrl"
            type="url"
            placeholder="https://meet.google.com/abc-defg-hij"
            defaultValue={meetingUrl ?? ""}
          />
          <p className="mt-1 text-xs text-ink-soft">
            Google Meet, Zoom, Teams, Discord or any https:// link. Attendees see a <span className="font-semibold">Join Workshop</span> button as
            soon as it&apos;s saved. Clear the field to remove the link.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PanelSubmit>
            <Link2 className="h-4 w-4" /> Save link
          </PanelSubmit>
        </div>
        <ActionFeedback state={state} />
      </form>
    </Panel>
  );
}

export function ReschedulePanel({
  id, date, startTime, endTime,
}: {
  id: string; date: string; startTime: string; endTime: string;
}) {
  const [state, formAction] = useActionState(rescheduleWorkshopAction, null);

  return (
    <Panel title="Reschedule">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={id} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="resch-date">New date</Label>
            <Input id="resch-date" name="date" type="date" defaultValue={date} required />
          </div>
          <div>
            <Label htmlFor="resch-start">Start</Label>
            <Input id="resch-start" name="startTime" type="time" defaultValue={startTime} required />
          </div>
          <div>
            <Label htmlFor="resch-end">End</Label>
            <Input id="resch-end" name="endTime" type="time" defaultValue={endTime} required />
          </div>
        </div>
        <p className="text-xs text-ink-soft">
          The new time appears immediately on the public page and on every attendee&apos;s access link.
        </p>
        <div>
          <PanelSubmit>
            <CalendarClock className="h-4 w-4" /> Reschedule
          </PanelSubmit>
        </div>
        <ActionFeedback state={state} />
      </form>
    </Panel>
  );
}

export function RegistrationTogglePanel({ id, manualClosed }: { id: string; manualClosed: boolean }) {
  const [state, formAction] = useActionState(toggleRegistrationAction, null);
  return (
    <Panel title="Registration">
      <form action={formAction} className="flex items-center gap-3">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="close" value={(!manualClosed).toString()} />
        {manualClosed ? (
          <PanelSubmit variant="outline">
            <PlayCircle className="h-4 w-4" /> Reopen registration
          </PanelSubmit>
        ) : (
          <PanelSubmit variant="outline">
            <PauseCircle className="h-4 w-4" /> Close registration
          </PanelSubmit>
        )}
        <span className="text-sm text-ink-muted">
          {manualClosed ? "New registrations are paused." : "Attendees can register right now."}
        </span>
      </form>
      <ActionFeedback state={state} className="mt-3" />
    </Panel>
  );
}

export function StatusActions({
  id, current, canDelete,
}: {
  id: string;
  current: string;
  canDelete: boolean;
}) {
  const [cancelState, cancelAction] = useActionState(setWorkshopStatusAction, null);
  const [deleteState, deleteAction] = useActionState(deleteWorkshopAction, null);

  return (
    <Panel title="Cancel workshop">
      <p className="mb-3 text-sm text-ink-muted">
        Cancelling keeps all registrations on record and blocks new sign-ups. This cannot be undone by attendees — only you or an admin can
        restore the status.
      </p>
      {current !== "CANCELLED" ? (
        <form action={cancelAction} className="flex items-center gap-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="CANCELLED" />
          <PanelSubmit variant="destructive">
            <Ban className="h-4 w-4" /> Cancel workshop
          </PanelSubmit>
        </form>
      ) : (
        <form action={cancelAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="PUBLISHED" />
          <PanelSubmit variant="outline">Restore as published</PanelSubmit>
        </form>
      )}
      <ActionFeedback state={cancelState} className="mt-3" />

      {canDelete ? (
        <form action={deleteAction} className="mt-4 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-line/30 pt-4">
          <input type="hidden" name="id" value={id} />
          <PanelSubmit variant="destructive">Delete draft permanently</PanelSubmit>
          <ActionFeedback state={deleteState} className="flex-1" />
        </form>
      ) : null}
    </Panel>
  );
}
