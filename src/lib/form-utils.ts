import "server-only";
import { headers } from "next/headers";
import { zodErrors, checkRateLimit, type ActionState } from "@/lib/action-utils";
import {
  getOrganizerSession,
  hasPermission,
  type SessionOrganizer,
  type Permission,
} from "@/lib/auth";
import type { z } from "zod";

/** Parse FormData against a Zod schema; returns typed data or field errors. */
export function parseForm<S extends z.ZodTypeAny>(
  schema: S,
  formData: FormData,
): { ok: true; data: z.infer<S> } | { ok: false; fieldErrors: Record<string, string> } {
  // Support multi-value keys (e.g. permissions checkbox groups).
  const raw: Record<string, unknown> = {};
  for (const key of Array.from(formData.keys())) {
    const values = formData.getAll(key);
    raw[key] = values.length > 1 ? values : values[0];
  }
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, fieldErrors: zodErrors(result.error) };
}

/** Guard for server actions: rate limit → session → permission. */
export async function guardAction(
  permission: Permission,
  opts?: { limit?: number; windowSeconds?: number; action?: string },
): Promise<{ ok: true; organizer: SessionOrganizer } | { ok: false; state: ActionState }> {
  const action = opts?.action ?? `action:${permission}`;
  if (opts?.limit) {
    const h = await headers();
    const rl = await checkRateLimit(h, action, opts.limit, opts.windowSeconds ?? 60);
    if (!rl.ok) {
      return { ok: false, state: { ok: false, message: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` } };
    }
  }
  const organizer = await getOrganizerSession();
  if (!organizer) return { ok: false, state: { ok: false, message: "Please sign in again." } };
  if (!hasPermission(organizer, permission)) {
    return { ok: false, state: { ok: false, message: "You don't have permission to do that." } };
  }
  return { ok: true, organizer };
}
