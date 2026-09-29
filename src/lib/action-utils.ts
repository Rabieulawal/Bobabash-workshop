import { prisma } from "@/lib/db";
import { rateLimit, clientIpFromHeaders, pruneExpiredRateLimits } from "@/lib/ratelimit";

/** Server-action-safe wrapper around rateLimit keyed by IP + action. */
export async function checkRateLimit(
  headers: Headers,
  action: string,
  limit: number,
  windowSeconds: number,
) {
  const ip = clientIpFromHeaders(headers);
  if (Math.random() < 0.02) await pruneExpiredRateLimits().catch(() => {});
  return rateLimit(`${action}:${ip}`, limit, windowSeconds);
}

export type ActionState =
  | { ok: true; message?: string; attendeeUrl?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function zodErrors(error: { issues: { path: (string | number | symbol)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
