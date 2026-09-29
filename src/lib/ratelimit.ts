import { prisma } from "@/lib/db";

/**
 * Lightweight database-backed rate limiting (no in-memory state —
 * survives serverless cold starts and works on Vercel).
 * Fixed-window counters keyed by e.g. "register:1.2.3.4".
 */
export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const expiresAt = new Date(windowStart.getTime() + windowSeconds * 1000);

  const row = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, windowStart, expiresAt },
    update: { count: { increment: 1 } },
  });

  // If the row predates the current window, this upsert incremented a stale row —
  // reset it. upsert can't express this, so do a conditional update.
  if (row.windowStart.getTime() !== windowStart.getTime()) {
    const updated = await prisma.rateLimit.updateMany({
      where: { key, windowStart: { lt: windowStart } },
      data: { count: 1, windowStart, expiresAt },
    });
    if (updated.count > 0) {
      return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000));
  if (row.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  return { ok: true, remaining: Math.max(0, limit - row.count), retryAfterSeconds };
}

/** Occasional cleanup of expired windows (called opportunistically). */
export async function pruneExpiredRateLimits(): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 3_600_000) } } });
}

export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
