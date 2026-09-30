"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { createAttendeeToken, getAttendeeAccess } from "@/lib/auth";
import { registerAttendeeSchema, cancelRegistrationSchema } from "@/lib/validation";
import { zodErrors, checkRateLimit, type ActionState } from "@/lib/action-utils";
import { absoluteUrl } from "@/lib/app-url";

/**
 * Public registration flow.
 *
 * There is no email delivery: the attendee's secure access link (/my/<token>)
 * is returned directly to the browser and shown right after registering.
 * The database only ever stores the SHA-256 hash of the token.
 *
 * Submitting the same email again either re-issues the existing registration's
 * link ("already going") or, with mode="recover", asks for that link without
 * creating anything new — so a lost link is never a lockout.
 */
export async function registerAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = registerAttendeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Check your details.", fieldErrors: zodErrors(parsed.error) };
  }
  const { slug, email, mode } = parsed.data;

  const h = await headers();
  const rl = await checkRateLimit(h, "register", 8, 600);
  if (!rl.ok) {
    return { ok: false, message: `Too many registration attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} min.` };
  }

  const workshop = await prisma.workshop.findUnique({
    where: { slug },
    include: { _count: { select: { registrations: { where: { status: "CONFIRMED" } } } } },
  });
  if (!workshop || !["PUBLISHED", "FULLY_BOOKED", "REGISTRATION_CLOSED"].includes(workshop.status)) {
    return { ok: false, message: "This workshop isn't open for registration." };
  }

  const existing = await prisma.registration.findUnique({
    where: { workshopId_attendeeEmail: { workshopId: workshop.id, attendeeEmail: email } },
  });

  // Already registered — hand their (fresh) access link back instead of locking
  // them out. This always wins, even when the workshop is full, closed or has
  // already started: their seat is already theirs and the browser is the only
  // delivery channel.
  if (existing && existing.status === "CONFIRMED") {
    const token = await createAttendeeToken(existing.id);
    return {
      ok: true,
      message: "You're already going! We refreshed your access link below.",
      attendeeUrl: absoluteUrl(`/my/${token}`),
    };
  }

  // "Recover my link" only ever returns an existing registration.
  if (mode === "recover") {
    return { ok: false, message: "No confirmed registration found for that email — check the address." };
  }

  if (workshop.manualClosed) {
    return { ok: false, message: "Registration for this workshop is closed." };
  }
  if (workshop.startsAt < new Date()) {
    return { ok: false, message: "This workshop has already taken place." };
  }
  if (workshop.capacity != null && workshop._count.registrations >= workshop.capacity) {
    return { ok: false, message: "This workshop is fully booked." };
  }

  // (Re)create registration + rotate token atomically.
  const registration = existing
    ? await prisma.registration.update({
        where: { id: existing.id },
        data: { status: "CONFIRMED", updatedAt: new Date() },
      })
    : await prisma.registration.create({
        data: {
          workshopId: workshop.id,
          attendeeEmail: email,
          // Placeholder token row; rotated to a real hashed token below.
          secureTokenHash: randomBytes(32).toString("hex"),
          tokenExpiresAt: new Date(Date.now() + 30 * 86_400_000),
        },
      });

  const token = await createAttendeeToken(registration.id);

  revalidatePath(`/workshops/${slug}`);
  return {
    ok: true,
    message: "You're going! Keep this private link — it's your way back in.",
    attendeeUrl: absoluteUrl(`/my/${token}`),
  };
}

export async function cancelRegistrationAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = cancelRegistrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Invalid link." };

  const access = await getAttendeeAccess(parsed.data.token);
  if (!access) return { ok: false, message: "This access link has expired. Register again on the workshop page for a fresh link." };
  if (!access.canCancel) return { ok: false, message: "This registration can no longer be cancelled." };

  const { workshop } = access;
  await prisma.registration.update({
    where: { id: access.registrationId },
    data: { status: "CANCELLED" },
  });

  revalidatePath(`/workshops/${workshop.slug}`);
  return { ok: true, message: "Your registration has been cancelled." };
}
