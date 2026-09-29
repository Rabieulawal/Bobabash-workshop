import { z } from "zod";

/* ── Shared primitives ──────────────────────────────────── */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Email is required")
  .max(254, "Email is too long")
  .email("Enter a valid email address");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be at most 32 characters")
  .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes or underscores");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

/** HTTPS-only meeting links (Google Meet, Zoom, Teams, or any https URL). */
export const httpsUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url("Enter a valid URL")
  .refine((v) => /^https:\/\//i.test(v), "Link must start with https://");

export const optionalHttpsUrl = z
  .union([httpsUrlSchema, z.literal("").transform(() => null), z.null()])
  .optional()
  .transform((v) => v ?? null);

/** HTML checkboxes submit "on" when checked (absent when unchecked). */
export const booleanish = z
  .union([
    z.boolean(),
    z.literal("on").transform(() => true),
    z.literal("true").transform(() => true),
    z.literal("").transform(() => false),
    z.literal("false").transform(() => false),
  ])
  .optional()
  .transform((v) => v ?? false);

export const optionalText = (max = 500) =>
  z
    .union([z.string().trim().max(max), z.literal("").transform(() => ""), z.null()])
    .optional()
    .transform((v) => (v ? v : null));

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only");

/* ── Attendee registration ──────────────────────────────── */

export const registerAttendeeSchema = z.object({
  slug: slugSchema,
  email: emailSchema,
});
export type RegisterAttendeeInput = z.infer<typeof registerAttendeeSchema>;

export const cancelRegistrationSchema = z.object({
  token: z.string().min(16).max(128),
});

/* ── Auth ───────────────────────────────────────────────── */

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Password is required").max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/* ── Workshops ──────────────────────────────────────────── */

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time");

export const workshopCoreSchema = {
  title: z.string().trim().min(3, "Title is required").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000),
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  format: z.enum(["ONLINE", "IN_PERSON"]),
  location: optionalText(200),
  capacity: z
    .union([
      z.coerce.number().int("Whole numbers only").min(1, "Capacity must be at least 1").max(100000),
      z.literal("").transform(() => null),
      z.null(),
    ])
    .optional()
    .transform((v) => v ?? null),
  meetingUrl: optionalHttpsUrl,
  coverImageUrl: optionalHttpsUrl,
  status: z.enum(["DRAFT", "PUBLISHED", "REGISTRATION_CLOSED", "FULLY_BOOKED", "CANCELLED", "COMPLETED"]),
  organizationId: z.string().min(1, "Choose an organization"),
};

export const createWorkshopSchema = z
  .object({ ...workshopCoreSchema, status: z.enum(["DRAFT", "PUBLISHED"]) })
  .refine((v) => v.format !== "IN_PERSON" || (v.location && v.location.length > 0), {
    message: "Location is required for in-person workshops",
    path: ["location"],
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });
export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;

export const updateWorkshopSchema = z
  .object({ ...workshopCoreSchema })
  .refine((v) => v.format !== "IN_PERSON" || (v.location && v.location.length > 0), {
    message: "Location is required for in-person workshops",
    path: ["location"],
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });
export type UpdateWorkshopInput = z.infer<typeof updateWorkshopSchema>;

export const rescheduleWorkshopSchema = z
  .object({
    date: dateString,
    startTime: timeString,
    endTime: timeString,
    notify: booleanish,
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const meetingLinkSchema = z.object({
  meetingUrl: optionalHttpsUrl,
  notify: booleanish,
});

export const registrationActionSchema = z.object({
  registrationId: z.string().min(1),
  action: z.enum(["confirm", "cancel"]),
});

/* ── Organizers (admin) ─────────────────────────────────── */

export const organizerCoreSchema = {
  name: z.string().trim().min(2, "Name is required").max(80),
  username: usernameSchema,
  organizationId: z
    .union([z.string().min(1), z.literal("").transform(() => null), z.null()])
    .optional()
    .transform((v) => v ?? null),
  role: z.enum(["SUPER_ADMIN", "ORGANIZER", "WORKSHOP_MANAGER"]),
  permissions: z.array(z.string()).max(20).optional().default([]),
  active: booleanish,
};

export const createOrganizerSchema = z.object({
  ...organizerCoreSchema,
  password: passwordSchema,
});
export type CreateOrganizerInput = z.infer<typeof createOrganizerSchema>;

export const updateOrganizerSchema = z.object({ ...organizerCoreSchema });
export type UpdateOrganizerInput = z.infer<typeof updateOrganizerSchema>;

export const resetOrganizerPasswordSchema = z.object({
  organizerId: z.string().min(1),
  newPassword: passwordSchema,
  mustChangePassword: z.boolean().optional().default(true),
});

export const setOrganizerActiveSchema = z.object({
  organizerId: z.string().min(1),
  active: z.boolean(),
});

/* ── Organizations (admin) ──────────────────────────────── */

export const organizationSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: slugSchema.optional(),
  description: optionalText(500),
  isFeatured: booleanish,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});
export type OrganizationInput = z.infer<typeof organizationSchema>;

/* ── Workshop discovery ─────────────────────────────────── */

export const workshopQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  when: z.enum(["upcoming", "today", "tomorrow", "week"]).optional().default("upcoming"),
  format: z.enum(["all", "online", "in_person"]).optional().default("all"),
  org: z.string().trim().max(96).optional(), // org slug or "other-events"
  sort: z.enum(["soonest", "popular", "newest"]).optional().default("soonest"),
});
export type WorkshopQuery = z.infer<typeof workshopQuerySchema>;

export const resendAccessSchema = z.object({ email: emailSchema });
