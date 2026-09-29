import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrganizerSession, hasPermission, PERMISSIONS } from "@/lib/auth";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const organizer = await getOrganizerSession();
  if (!organizer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const workshop = await prisma.workshop.findUnique({
    where: { id },
    include: { organization: { select: { name: true } } },
  });
  if (!workshop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPlatformWide =
    organizer.role === "SUPER_ADMIN" || hasPermission(organizer, PERMISSIONS.REGISTRATIONS_MANAGE_ALL);
  if (!isPlatformWide && workshop.organizerId !== organizer.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const registrations = await prisma.registration.findMany({
    where: { workshopId: id },
    orderBy: { createdAt: "asc" },
    select: { attendeeEmail: true, status: true, createdAt: true },
  });

  const rows = [
    ["workshop", "organization", "attendee_email", "status", "registered_at_pkT"],
    ...registrations.map((r) => [
      workshop.title,
      workshop.organization.name,
      r.attendeeEmail,
      r.status,
      r.createdAt.toLocaleString("en-US", { timeZone: "Asia/Karachi" }),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");

  const safeSlug = workshop.slug.replace(/[^a-z0-9-]/gi, "");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendees-${safeSlug || "export"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
