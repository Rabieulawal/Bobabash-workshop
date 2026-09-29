"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createOrganizerSession,
  destroyOrganizerSession,
  getOrganizerSession,
} from "@/lib/auth";
import { loginSchema, changePasswordSchema } from "@/lib/validation";
import { zodErrors, checkRateLimit, type ActionState } from "@/lib/action-utils";

export async function loginAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Check your details.", fieldErrors: zodErrors(parsed.error) };
  }

  const h = await headers();
  const rl = await checkRateLimit(h, "login", 10, 300);
  if (!rl.ok) {
    return { ok: false, message: `Too many login attempts. Try again in ${rl.retryAfterSeconds}s.` };
  }

  const organizer = await prisma.organizer.findUnique({
    where: { username: parsed.data.username.toLowerCase() },
  });
  // Uniform failure response — never reveal whether the username exists.
  if (!organizer || !organizer.active) {
    return { ok: false, message: "Invalid username or password." };
  }
  const valid = await verifyPassword(parsed.data.password, organizer.passwordHash);
  if (!valid) {
    return { ok: false, message: "Invalid username or password." };
  }

  await createOrganizerSession(organizer.id, {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: h.get("user-agent") ?? undefined,
  });
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroyOrganizerSession();
  redirect("/admin/login");
}

export async function changePasswordAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const session = await getOrganizerSession();
  if (!session) return { ok: false, message: "Please sign in again." };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Check your details.", fieldErrors: zodErrors(parsed.error) };
  }

  const organizer = await prisma.organizer.findUnique({ where: { id: session.id } });
  if (!organizer) return { ok: false, message: "Account not found." };

  const valid = await verifyPassword(parsed.data.currentPassword, organizer.passwordHash);
  if (!valid) {
    return { ok: false, message: "Current password is incorrect.", fieldErrors: { currentPassword: "Incorrect password" } };
  }
  if (parsed.data.newPassword === parsed.data.currentPassword) {
    return { ok: false, message: "New password must be different from the current one.", fieldErrors: { newPassword: "Choose a different password" } };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.organizer.update({
    where: { id: session.id },
    data: { passwordHash, mustChangePassword: false },
  });
  revalidatePath("/admin/account");
  return { ok: true, message: "Password updated." };
}
