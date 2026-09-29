"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { guardAction, parseForm } from "@/lib/form-utils";
import { zodErrors, type ActionState } from "@/lib/action-utils";
import {
  createOrganizerSchema,
  updateOrganizerSchema,
  resetOrganizerPasswordSchema,
  setOrganizerActiveSchema,
  organizationSchema,
} from "@/lib/validation";
import { PERMISSIONS, hashPassword } from "@/lib/auth";
import { uniqueSlugFor } from "@/lib/workshops";

/* ── Organizers ─────────────────────────────────────────── */

export async function createOrganizerAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.ORGANIZERS_MANAGE);
  if (!guard.ok) return guard.state;

  const parsed = parseForm(createOrganizerSchema, formData);
  if (!parsed.ok) return { ok: false, message: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };
  const data = parsed.data;

  const exists = await prisma.organizer.findUnique({ where: { username: data.username.toLowerCase() } });
  if (exists) {
    return { ok: false, message: "That username is taken.", fieldErrors: { username: "Already in use" } };
  }
  if (data.role !== "SUPER_ADMIN" && !data.organizationId) {
    return { ok: false, message: "Non-admin organizers need an organization.", fieldErrors: { organizationId: "Required" } };
  }

  const passwordHash = await hashPassword(data.password);
  await prisma.organizer.create({
    data: {
      name: data.name,
      username: data.username.toLowerCase(),
      passwordHash,
      role: data.role,
      organizationId: data.organizationId,
      permissions: data.permissions,
      active: data.active,
      mustChangePassword: true,
    },
  });

  revalidatePath("/admin/organizers");
  return { ok: true, message: `Organizer "${data.username}" created. Share the credentials securely.` };
}

export async function updateOrganizerAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.ORGANIZERS_MANAGE);
  if (!guard.ok) return guard.state;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing organizer." };

  const parsed = parseForm(updateOrganizerSchema, formData);
  if (!parsed.ok) return { ok: false, message: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };
  const data = parsed.data;

  const existing = await prisma.organizer.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Organizer not found." };

  const clash = await prisma.organizer.findFirst({
    where: { username: data.username.toLowerCase(), id: { not: id } },
  });
  if (clash) return { ok: false, message: "That username is taken.", fieldErrors: { username: "Already in use" } };

  if (data.role !== "SUPER_ADMIN" && !data.organizationId) {
    return { ok: false, message: "Non-admin organizers need an organization.", fieldErrors: { organizationId: "Required" } };
  }

  // Prevent a super admin from locking themselves out by deactivating the last admin.
  if (existing.role === "SUPER_ADMIN" && (!data.active || data.role !== "SUPER_ADMIN")) {
    const activeAdmins = await prisma.organizer.count({ where: { role: "SUPER_ADMIN", active: true } });
    if (activeAdmins <= 1) {
      return { ok: false, message: "At least one active super admin is required." };
    }
  }

  await prisma.organizer.update({
    where: { id },
    data: {
      name: data.name,
      username: data.username.toLowerCase(),
      role: data.role,
      organizationId: data.organizationId,
      permissions: data.permissions,
      active: data.active,
    },
  });

  revalidatePath("/admin/organizers");
  return { ok: true, message: "Organizer updated." };
}

export async function resetOrganizerPasswordAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.ORGANIZERS_MANAGE);
  if (!guard.ok) return guard.state;

  const parsed = resetOrganizerPasswordSchema.safeParse({
    organizerId: formData.get("organizerId"),
    newPassword: formData.get("newPassword"),
    mustChangePassword: formData.get("mustChangePassword") === "on",
  });
  if (!parsed.success) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
  }

  const organizer = await prisma.organizer.findUnique({ where: { id: parsed.data.organizerId } });
  if (!organizer) return { ok: false, message: "Organizer not found." };

  await prisma.$transaction([
    prisma.organizer.update({
      where: { id: organizer.id },
      data: {
        passwordHash: await hashPassword(parsed.data.newPassword),
        mustChangePassword: parsed.data.mustChangePassword,
      },
    }),
    prisma.session.deleteMany({ where: { userId: organizer.id, target: "ORGANIZER" } }),
  ]);

  revalidatePath("/admin/organizers");
  return { ok: true, message: `Password reset for "${organizer.username}". All their sessions were signed out.` };
}

export async function setOrganizerActiveAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.ORGANIZERS_MANAGE);
  if (!guard.ok) return guard.state;

  const parsed = setOrganizerActiveSchema.safeParse({
    organizerId: formData.get("organizerId"),
    active: formData.get("active") === "true",
  });
  if (!parsed.success) return { ok: false, message: "Invalid request." };

  const organizer = await prisma.organizer.findUnique({ where: { id: parsed.data.organizerId } });
  if (!organizer) return { ok: false, message: "Organizer not found." };

  if (organizer.role === "SUPER_ADMIN" && !parsed.data.active) {
    const activeAdmins = await prisma.organizer.count({ where: { role: "SUPER_ADMIN", active: true } });
    if (activeAdmins <= 1) return { ok: false, message: "At least one active super admin is required." };
  }

  await prisma.$transaction([
    prisma.organizer.update({ where: { id: organizer.id }, data: { active: parsed.data.active } }),
    ...(parsed.data.active ? [] : [prisma.session.deleteMany({ where: { userId: organizer.id } })]),
  ]);

  revalidatePath("/admin/organizers");
  return { ok: true, message: parsed.data.active ? "Organizer enabled." : "Organizer disabled and signed out." };
}

/* ── Organizations ──────────────────────────────────────── */

export async function createOrganizationAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.ORGANIZATIONS_MANAGE);
  if (!guard.ok) return guard.state;

  const parsed = parseForm(organizationSchema, formData);
  if (!parsed.ok) return { ok: false, message: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };

  const slug = await uniqueSlugFor(parsed.data.slug || parsed.data.name, "organization");
  await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      isFeatured: parsed.data.isFeatured,
      status: parsed.data.status,
    },
  });

  revalidatePath("/admin/organizations");
  revalidatePath("/");
  return { ok: true, message: `Organization "${parsed.data.name}" created.` };
}

export async function updateOrganizationAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.ORGANIZATIONS_MANAGE);
  if (!guard.ok) return guard.state;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing organization." };

  const parsed = parseForm(organizationSchema, formData);
  if (!parsed.ok) return { ok: false, message: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };

  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Organization not found." };

  await prisma.organization.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      isFeatured: parsed.data.isFeatured,
      status: parsed.data.status,
    },
  });

  revalidatePath("/admin/organizations");
  revalidatePath("/");
  revalidatePath(`/${existing.slug}`);
  return { ok: true, message: "Organization updated." };
}

/* ── Registrations (super admin override) ───────────────── */

export async function adminAnyRegistrationAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const guard = await guardAction(PERMISSIONS.REGISTRATIONS_MANAGE_ALL);
  if (!guard.ok) return guard.state;

  const registrationId = String(formData.get("registrationId") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!registrationId || !["confirm", "cancel"].includes(action)) {
    return { ok: false, message: "Invalid request." };
  }

  await prisma.registration.update({
    where: { id: registrationId },
    data: { status: action === "confirm" ? "CONFIRMED" : "CANCELLED" },
  });

  revalidatePath("/admin/registrations");
  return { ok: true, message: "Registration updated." };
}
