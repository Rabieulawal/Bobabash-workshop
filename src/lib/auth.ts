import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { SessionTarget, Organizer, Role } from "@prisma/client";

/**
 * Authentication: organizer sessions (username+password) and
 * passwordless attendee tokens. Session tokens are random 32-byte
 * strings; only SHA-256 hashes are stored in the database.
 */

const ORGANIZER_COOKIE = "bb_session";
const ATTENDEE_COOKIE = "bb_attendee";
const ORGANIZER_SESSION_DAYS = 14;
const ATTENDEE_SESSION_DAYS = 30;

/* ── Password hashing (bcryptjs, pure JS — works on Vercel) ── */

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}

/* ── Token primitives (shared by sessions & attendee links) ── */

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* ── Organizer sessions ─────────────────────────────────── */

export type SessionOrganizer = Pick<
  Organizer,
  "id" | "name" | "username" | "role" | "organizationId" | "permissions" | "active" | "mustChangePassword"
>;

export async function createOrganizerSession(organizerId: string, meta?: { ip?: string; userAgent?: string }) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + ORGANIZER_SESSION_DAYS * 86_400_000);
  await prisma.session.create({
    data: {
      userId: organizerId,
      target: "ORGANIZER",
      tokenHash: hashToken(token),
      expiresAt,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent?.slice(0, 300) ?? null,
    },
  });
  const jar = await cookies();
  jar.set(ORGANIZER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyOrganizerSession() {
  const jar = await cookies();
  const token = jar.get(ORGANIZER_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token), target: "ORGANIZER" } });
  }
  jar.delete(ORGANIZER_COOKIE);
}

export async function getOrganizerSession(): Promise<SessionOrganizer | null> {
  const jar = await cookies();
  const token = jar.get(ORGANIZER_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organizer: true },
  });
  if (!session || session.target !== "ORGANIZER" || session.expiresAt < new Date()) return null;
  const { organizer } = session;
  if (!organizer.active) return null;
  return {
    id: organizer.id,
    name: organizer.name,
    username: organizer.username,
    role: organizer.role,
    organizationId: organizer.organizationId,
    permissions: organizer.permissions,
    active: organizer.active,
    mustChangePassword: organizer.mustChangePassword,
  };
}

/* ── Attendee passwordless tokens ───────────────────────── */

export async function createAttendeeToken(registrationId: string, days = ATTENDEE_SESSION_DAYS): Promise<string> {
  const token = generateToken(24);
  await prisma.registration.update({
    where: { id: registrationId },
    data: { secureTokenHash: hashToken(token), tokenExpiresAt: new Date(Date.now() + days * 86_400_000) },
  });
  return token;
}

/** One-time rotation guard: token can be re-issued on demand, always hashed at rest. */
export async function rotateAttendeeToken(registrationId: string): Promise<string> {
  return createAttendeeToken(registrationId, ATTENDEE_SESSION_DAYS);
}

export type AttendeeAccess = {
  email: string;
  workshop: {
    id: string;
    slug: string;
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
    format: "ONLINE" | "IN_PERSON";
    location: string | null;
    meetingUrl: string | null;
    status: string;
    organizationName: string;
    organizationSlug: string;
  };
  registrationId: string;
  tokenExpiresAt: Date;
  canCancel: boolean;
};

/** Resolve an attendee access token into their registration + workshop. */
export async function getAttendeeAccess(token: string): Promise<AttendeeAccess | null> {
  if (!token || token.length < 16 || token.length > 128) return null;
  const registration = await prisma.registration.findFirst({
    where: { secureTokenHash: hashToken(token), tokenExpiresAt: { gt: new Date() } },
    include: {
      workshop: {
        include: { organization: { select: { name: true, slug: true } } },
      },
    },
  });
  if (!registration) return null;
  const w = registration.workshop;
  return {
    email: registration.attendeeEmail,
    registrationId: registration.id,
    tokenExpiresAt: registration.tokenExpiresAt,
    canCancel:
      registration.status === "CONFIRMED" &&
      (w.status === "PUBLISHED" || w.status === "FULLY_BOOKED") &&
      w.startsAt > new Date(),
    workshop: {
      id: w.id,
      slug: w.slug,
      title: w.title,
      description: w.description,
      startsAt: w.startsAt,
      endsAt: w.endsAt,
      format: w.format,
      location: w.location,
      meetingUrl: w.meetingUrl,
      status: w.status,
      organizationName: w.organization.name,
      organizationSlug: w.organization.slug,
    },
  };
}

/** Find the newest valid token-holding registration for an email (used by "resend access" flow). */
export async function findActiveRegistrationsByEmail(email: string) {
  return prisma.registration.findMany({
    where: { attendeeEmail: email.toLowerCase().trim(), status: "CONFIRMED", tokenExpiresAt: { gt: new Date() } },
    include: { workshop: { include: { organization: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

/* ── Permissions ────────────────────────────────────────── */

export const PERMISSIONS = {
  PLATFORM_MANAGE: "platform:manage",
  ORGANIZERS_MANAGE: "organizers:manage",
  ORGANIZATIONS_MANAGE: "organizations:manage",
  WORKSHOPS_MANAGE_ALL: "workshops:manage-all",
  REGISTRATIONS_MANAGE_ALL: "registrations:manage-all",
  WORKSHOPS_MANAGE_OWN: "workshops:manage-own",
  ATTENDEES_VIEW_OWN: "attendees:view-own",
  STATS_VIEW: "stats:view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ORGANIZER: [
    PERMISSIONS.WORKSHOPS_MANAGE_OWN,
    PERMISSIONS.ATTENDEES_VIEW_OWN,
    PERMISSIONS.STATS_VIEW,
  ],
  WORKSHOP_MANAGER: [
    PERMISSIONS.WORKSHOPS_MANAGE_OWN,
    PERMISSIONS.ATTENDEES_VIEW_OWN,
  ],
};

export function rolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(
  organizer: Pick<SessionOrganizer, "role" | "permissions">,
  permission: Permission,
): boolean {
  if (organizer.role === "SUPER_ADMIN") return true;
  const granted = new Set<string>([...rolePermissions(organizer.role), ...organizer.permissions]);
  return granted.has(permission);
}

/** Require a permission or throw — call inside server actions / route handlers. */
export async function requirePermission(permission: Permission): Promise<SessionOrganizer> {
  const organizer = await getOrganizerSession();
  if (!organizer) throw new Error("UNAUTHENTICATED");
  if (!hasPermission(organizer, permission)) throw new Error("FORBIDDEN");
  return organizer;
}
