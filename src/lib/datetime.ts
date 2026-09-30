import type { WorkshopStatus } from "@prisma/client";

/* ── Status helpers ─────────────────────────────────────── */

/** Registration is open for attendees right now. */
export function isRegistrationOpen(
  workshop: { status: WorkshopStatus; manualClosed: boolean; startsAt: Date },
  confirmedCount: number,
  capacity: number | null,
): boolean {
  if (workshop.status !== "PUBLISHED" && workshop.status !== "FULLY_BOOKED") return false;
  if (workshop.manualClosed) return false;
  if (workshop.startsAt < new Date()) return false;
  if (capacity != null && confirmedCount >= capacity) return false;
  return true;
}

/* ── Date/time formatting (display in Asia/Karachi — Lahore) ── */

const TZ = "Asia/Karachi";

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: TZ });
}

export function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
}

export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatDateTime(d: Date): string {
  return `${formatDate(d)} · ${formatTime(d)}`;
}

/** "Today" / "Tomorrow" / weekday label in Lahore time. */
export function dayLabel(d: Date): string {
  const now = new Date();
  const toLahoreDay = (x: Date) =>
    Number(
      new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
        .format(x)
        .replaceAll("-", ""),
    );
  const diff = toLahoreDay(d) - toLahoreDay(now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long", timeZone: TZ });
}

/* ── Filter windows (computed in Lahore time) ───────────── */

function lahoreDateParts(d: Date): { y: number; m: number; day: number; h: number; min: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  return { y: get("year"), m: get("month"), day: get("day"), h: get("hour") % 24, min: get("minute") };
}

/** UTC instant corresponding to Lahore local midnight of N days after today. */
export function lahoreMidnightUTC(daysFromToday = 0): Date {
  const { y, m, day } = lahoreDateParts(new Date(Date.now() + 5 * 3600_000)); // current Lahore date
  const shifted = new Date(Date.UTC(y, m - 1, day + daysFromToday, 0, 0, 0));
  // Lahore is UTC+5 fixed — local midnight = previous day 19:00 UTC
  return new Date(shifted.getTime() - 5 * 3600_000);
}

export function workshopRangeFilter(when: "upcoming" | "today" | "tomorrow" | "week") {
  const now = new Date();
  if (when === "today") {
    const start = lahoreMidnightUTC(0);
    const end = lahoreMidnightUTC(1);
    return { startsAt: { gte: start, lt: end } };
  }
  if (when === "tomorrow") {
    const start = lahoreMidnightUTC(1);
    const end = lahoreMidnightUTC(2);
    return { startsAt: { gte: start, lt: end } };
  }
  if (when === "week") {
    const start = now;
    const end = lahoreMidnightUTC(7);
    return { startsAt: { gte: start, lt: end } };
  }
  return { startsAt: { gte: now } };
}

/* ── Slug generation ────────────────────────────────────── */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* ── Compose a Date from Lahore-local date + time strings ── */

export function lahoreCompose(dateStr: string, timeStr: string): Date {
  // dateStr: YYYY-MM-DD, timeStr: HH:MM (both Lahore local) → UTC Date
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - 5 * 3600_000);
}

export function lahoreDecompose(date: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hh = (get("hour") === "24" ? "00" : get("hour"));
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${hh}:${get("minute")}` };
}

