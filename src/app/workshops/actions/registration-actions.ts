"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import {
  createAttendeeToken,
  getAttendeeAccess,
  findActiveRegistrationsByEmail,
} from "@/lib/auth";
import {
  registerAttendeeSchema,
  cancelRegistrationSchema,
  resendAccessSchema,
} from "@/lib/validation";
import { zodErrors, checkRateLimit, type ActionState } from "@/lib/action-utils";
import { absoluteUrl } from "@/lib/app-url";
import {
  sendRegistrationConfirmation,
  sendCancellation,
  sendAccessLinks,
} from "@/lib/email";
import type { WorkshopEmailInfo } from "@/lib/email";

function emailInfo(w: {
  title: string; startsAt: Date; endsAt: Date; format: string; location: string | null;
  meetingUrl: string | null; slug: string; organization: { name: string };
}): WorkshopEmailInfo {
  return {
    title: w.title,
    startsAt: w.startsAt,
    endsAt: w.endsAt,
    format: w.format,
    location: w.location,
    meetingUrl: w.meetingUrl,
    organizationName: w.organization.name,
    slug: w.slug,
  };
}

export async function registerAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = registerAttendeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Check your details.", fieldErrors: zodErrors(parsed.error) };
  }
  const { slug, email } = parsed.data;

  const h = await headers();
  const rl = await checkRateLimit(h, "register", 8, 600);
  if (!rl.ok) {
    return { ok: false, message: `Too many registration attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} min.` };
  }

  const workshop = await prisma.workshop.findUnique({
    where: { slug },
    include: {
      organization: { select: { name: true } },
      _count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
    },
  });
  if (!workshop || !["PUBLISHED", "FULLY_BOOKED"].includes(workshop.status)) {
    return { ok: false, message: "This workshop isn't open for registration." };
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

  const existing = await prisma.registration.findUnique({
    where: { workshopId_attendeeEmail: { workshopId: workshop.id, attendeeEmail: email } },
  });
  if (existing && existing.status === "CONFIRMED") {
    return { ok: false, message: "This email is already registered for this workshop." };
  }

  // (Re)create registration + rotate token atomically.
  const registration = existing
    ? await prisma.registration.update({
        where: { id: existing.id },
        data: { status: "CONFIRMED", notifiedAt: null, updatedAt: new Date() },
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
  const attendeeUrl = absoluteUrl(`/my/${token}`);

  const result = await sendRegistrationConfirmation(email, emailInfo(workshop), attendeeUrl);
  if (result.delivered) {
    await prisma.registration.update({ where: { id: registration.id }, data: { notifiedAt: new Date() } });
  }

  revalidatePath(`/workshops/${slug}`);
  return { ok: true, message: `You're going! Confirmation sent to ${email}.`, attendeeUrl: result.delivered ? undefined : attendeeUrl };
}

export async function cancelRegistrationAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = cancelRegistrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Invalid link." };

  const access = await getAttendeeAccess(parsed.data.token);
  if (!access) return { ok: false, message: "This link has expired. Ask the organizer to resend it." };
  if (!access.canCancel) return { ok: false, message: "This registration can no longer be cancelled." };

  const { workshop } = access;
  await prisma.registration.update({
    where: { id: access.registrationId },
    data: { status: "CANCELLED" },
  });

  const info = emailInfo({ ...workshop, organization: { name: workshop.organizationName } });
  await sendCancellation(access.email, info);

  revalidatePath(`/workshops/${workshop.slug}`);
  return { ok: true, message: "Your registration has been cancelled." };
}

/**
 * "Resend my access links" — emails fresh tokens for all upcoming
 * registrations of the given address. Always succeeds from the caller's
 * point of view (no address enumeration).
 */
export async function resendAccessAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = resendAccessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address.", fieldErrors: zodErrors(parsed.error) };
  }
  const email = parsed.data.email;

  const h = await headers();
  const rl = await checkRateLimit(h, "resend-access", 4, 600);
  if (!rl.ok) {
    return { ok: false, message: `Too many requests. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} min.` };
  }

  const registrations = await findActiveRegistrationsByEmail(email);
  const items: { title: string; url: string; startsAt: Date }[] = [];
  for (const r of registrations.slice(0, 5)) {
    const token = await createAttendeeToken(r.id);
    items.push({ title: r.workshop.title, url: absoluteUrl(`/my/${token}`), startsAt: r.workshop.startsAt });
  }

  if (items.length > 0) {
    await sendAccessLinks(email, items);
  }
  // Identical response either way to prevent enumeration.
  return { ok: true, message: "If that email has upcoming registrations, the links are on their way." };
}
