"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { guardAction, parseForm } from "@/lib/form-utils";
import { type ActionState } from "@/lib/action-utils";
import {
  createWorkshopSchema,
  updateWorkshopSchema,
  rescheduleWorkshopSchema,
  meetingLinkSchema,
  registrationActionSchema,
} from "@/lib/validation";
import { lahoreCompose } from "@/lib/datetime";
import { uniqueSlugFor } from "@/lib/workshops";
import { PERMISSIONS } from "@/lib/auth";

async function assertOwnWorkshop(organizerId: string, role: string, workshopId: string) {
  const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
  if (!workshop) return null;
  if (role !== "SUPER_ADMIN" && workshop.organizerId !== organizerId) return null;
  return workshop;
}

export async function createWorkshopAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.WORKSHOPS_MANAGE_OWN);
  if (!guard.ok) return guard.state;

  const parsed = parseForm(createWorkshopSchema, formData);
  if (!parsed.ok) return { ok: false, message: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };
  const data = parsed.data;

  // Organizer must belong to the chosen organization (super admin exempt).
  if (guard.organizer.role !== "SUPER_ADMIN") {
    if (!guard.organizer.organizationId || guard.organizer.organizationId !== data.organizationId) {
      return { ok: false, message: "You can only create workshops for your own organization.", fieldErrors: { organizationId: "Not your organization" } };
    }
  }

  const org = await prisma.organization.findUnique({ where: { id: data.organizationId } });
  if (!org || org.status !== "ACTIVE") {
    return { ok: false, message: "Choose a valid organization.", fieldErrors: { organizationId: "Invalid organization" } };
  }

  const slug = await uniqueSlugFor(data.title, "workshop");
  const workshop = await prisma.workshop.create({
    data: {
      slug,
      title: data.title,
      description: data.description,
      coverImageUrl: data.coverImageUrl,
      startsAt: lahoreCompose(data.date, data.startTime),
      endsAt: lahoreCompose(data.date, data.endTime),
      meetingUrl: data.meetingUrl,
      capacity: data.capacity,
      status: data.status,
      organizationId: data.organizationId,
      organizerId: guard.organizer.id,
    },
  });

  revalidatePath("/admin/workshops");
  revalidatePath("/workshops");
  redirect(`/admin/workshops/${workshop.id}?created=1`);
}

export async function updateWorkshopAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.WORKSHOPS_MANAGE_OWN);
  if (!guard.ok) return guard.state;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing workshop." };
  const existing = await assertOwnWorkshop(guard.organizer.id, guard.organizer.role, id);
  if (!existing) return { ok: false, message: "Workshop not found (or not yours to edit)." };

  const parsed = parseForm(updateWorkshopSchema, formData);
  if (!parsed.ok) return { ok: false, message: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };
  const data = parsed.data;

  if (guard.organizer.role !== "SUPER_ADMIN") {
    if (!guard.organizer.organizationId || guard.organizer.organizationId !== data.organizationId) {
      return { ok: false, message: "You can only keep workshops within your own organization." };
    }
  }

  await prisma.workshop.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      coverImageUrl: data.coverImageUrl,
      startsAt: lahoreCompose(data.date, data.startTime),
      endsAt: lahoreCompose(data.date, data.endTime),
      meetingUrl: data.meetingUrl,
      capacity: data.capacity,
      status: data.status,
      organizationId: data.organizationId,
    },
  });

  revalidatePath("/admin/workshops");
  revalidatePath(`/admin/workshops/${id}`);
  revalidatePath(`/workshops/${existing.slug}`);
  return { ok: true, message: "Workshop updated." };
}

export async function rescheduleWorkshopAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.WORKSHOPS_MANAGE_OWN);
  if (!guard.ok) return guard.state;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing workshop." };
  const existing = await assertOwnWorkshop(guard.organizer.id, guard.organizer.role, id);
  if (!existing) return { ok: false, message: "Workshop not found (or not yours)." };

  const parsed = parseForm(rescheduleWorkshopSchema, formData);
  if (!parsed.ok) return { ok: false, message: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };
  const data = parsed.data;

  const startsAt = lahoreCompose(data.date, data.startTime);
  const endsAt = lahoreCompose(data.date, data.endTime);
  const isSameTime = existing.startsAt.getTime() === startsAt.getTime() && existing.endsAt.getTime() === endsAt.getTime();

  await prisma.workshop.update({
    where: { id },
    data: { startsAt, endsAt },
  });

  revalidatePath("/admin/workshops");
  revalidatePath(`/admin/workshops/${id}`);
  revalidatePath(`/workshops/${existing.slug}`);
  return { ok: true, message: isSameTime ? "Time unchanged." : "Rescheduled — the new time is live on the public page." };
}

export async function setMeetingLinkAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.WORKSHOPS_MANAGE_OWN);
  if (!guard.ok) return guard.state;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing workshop." };
  const existing = await assertOwnWorkshop(guard.organizer.id, guard.organizer.role, id);
  if (!existing) return { ok: false, message: "Workshop not found (or not yours)." };

  const parsed = parseForm(meetingLinkSchema, formData);
  if (!parsed.ok) return { ok: false, message: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };
  const meetingUrl = parsed.data.meetingUrl;

  await prisma.workshop.update({
    where: { id },
    data: { meetingUrl },
  });

  revalidatePath("/admin/workshops");
  revalidatePath(`/admin/workshops/${id}`);
  revalidatePath(`/workshops/${existing.slug}`);
  return {
    ok: true,
    message: meetingUrl ? "Meeting link saved — attendees can join from their access page." : "Meeting link removed.",
  };
}

export async function setWorkshopStatusAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.WORKSHOPS_MANAGE_OWN);
  if (!guard.ok) return guard.state;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["DRAFT", "PUBLISHED", "REGISTRATION_CLOSED", "FULLY_BOOKED", "CANCELLED", "COMPLETED"] as const;
  type Status = (typeof allowed)[number];
  if (!id || !allowed.includes(status as Status)) {
    return { ok: false, message: "Invalid status." };
  }

  const existing = await assertOwnWorkshop(guard.organizer.id, guard.organizer.role, id);
  if (!existing) return { ok: false, message: "Workshop not found (or not yours)." };

  await prisma.workshop.update({ where: { id }, data: { status: status as Status } });

  revalidatePath("/admin/workshops");
  revalidatePath(`/admin/workshops/${id}`);
  revalidatePath(`/workshops/${existing.slug}`);
  return { ok: true, message: `Status set to ${status.replaceAll("_", " ").toLowerCase()}.` };
}

export async function toggleRegistrationAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.WORKSHOPS_MANAGE_OWN);
  if (!guard.ok) return guard.state;

  const id = String(formData.get("id") ?? "");
  const close = String(formData.get("close") ?? "") === "true";
  if (!id) return { ok: false, message: "Missing workshop." };

  const existing = await assertOwnWorkshop(guard.organizer.id, guard.organizer.role, id);
  if (!existing) return { ok: false, message: "Workshop not found (or not yours)." };

  await prisma.workshop.update({ where: { id }, data: { manualClosed: close } });
  revalidatePath("/admin/workshops");
  revalidatePath(`/admin/workshops/${id}`);
  revalidatePath(`/workshops/${existing.slug}`);
  return { ok: true, message: close ? "Registration closed." : "Registration reopened." };
}

export async function deleteWorkshopAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.WORKSHOPS_MANAGE_OWN);
  if (!guard.ok) return guard.state;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing workshop." };
  const existing = await assertOwnWorkshop(guard.organizer.id, guard.organizer.role, id);
  if (!existing) return { ok: false, message: "Workshop not found (or not yours)." };

  // Only drafts or workshops with zero registrations may be deleted.
  const count = await prisma.registration.count({ where: { workshopId: id, status: "CONFIRMED" } });
  if (count > 0 || existing.status !== "DRAFT") {
    return { ok: false, message: "Only drafts with no confirmed registrations can be deleted. Cancel it instead." };
  }

  await prisma.workshop.delete({ where: { id } });
  revalidatePath("/admin/workshops");
  redirect("/admin/workshops?deleted=1");
}

export async function adminRegistrationAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.WORKSHOPS_MANAGE_OWN);
  if (!guard.ok) return guard.state;

  const parsed = registrationActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Invalid request." };

  const workshopId = String(formData.get("workshopId") ?? "");
  const workshop = await assertOwnWorkshop(guard.organizer.id, guard.organizer.role, workshopId);
  if (!workshop) return { ok: false, message: "Workshop not found (or not yours)." };

  const status = parsed.data.action === "cancel" ? "CANCELLED" : "CONFIRMED";
  await prisma.registration.updateMany({
    where: { id: parsed.data.registrationId, workshopId: workshop.id },
    data: { status },
  });

  revalidatePath(`/admin/workshops/${workshop.id}`);
  return { ok: true, message: "Registration updated." };
}
