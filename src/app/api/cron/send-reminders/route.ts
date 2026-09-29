import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAttendeeToken } from "@/lib/auth";
import { sendReminder, type WorkshopEmailInfo } from "@/lib/email";
import { absoluteUrl } from "@/lib/app-url";
import { lahoreMidnightUTC } from "@/lib/datetime";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron: daily reminder email for workshops starting tomorrow.
 * Authorization: Authorization: Bearer <CRON_SECRET> (Vercel sends this automatically).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = lahoreMidnightUTC(1);
  const end = lahoreMidnightUTC(2);

  const workshops = await prisma.workshop.findMany({
    where: {
      status: { in: ["PUBLISHED", "FULLY_BOOKED"] },
      startsAt: { gte: start, lt: end },
      remindersSentAt: null,
    },
    include: {
      organization: { select: { name: true } },
      registrations: { where: { status: "CONFIRMED" }, select: { id: true, attendeeEmail: true } },
    },
  });

  let sent = 0;
  const details: { workshop: string; attendees: number }[] = [];

  for (const w of workshops) {
    const info: WorkshopEmailInfo = {
      title: w.title,
      startsAt: w.startsAt,
      endsAt: w.endsAt,
      format: w.format,
      location: w.location,
      meetingUrl: w.meetingUrl,
      organizationName: w.organization.name,
      slug: w.slug,
    };
    for (const r of w.registrations) {
      const token = await createAttendeeToken(r.id);
      const result = await sendReminder(r.attendeeEmail, info, absoluteUrl(`/my/${token}`));
      if (result.delivered) sent++;
    }
    await prisma.workshop.update({ where: { id: w.id }, data: { remindersSentAt: new Date() } });
    details.push({ workshop: w.title, attendees: w.registrations.length });
  }

  return NextResponse.json({ ok: true, workshopsProcessed: workshops.length, remindersSent: sent, details });
}
