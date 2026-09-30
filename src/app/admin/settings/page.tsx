import { AdminHeader } from "@/components/admin/admin-header";
import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { requirePageOrganizer } from "@/lib/page-guards";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth";
import { lahoreMidnightUTC } from "@/lib/datetime";

export const dynamic = "force-dynamic";
export const metadata = { title: "Platform settings", robots: { index: false } };

export default async function SettingsPage() {
  const me = await requirePageOrganizer(PERMISSIONS.PLATFORM_MANAGE);
  const now = new Date();

  const [workshops, orgs, organizers, registrations, uniqueEmails, todayWorkshops, upcoming, recent] = await Promise.all([
    prisma.workshop.count(),
    prisma.organization.count(),
    prisma.organizer.count(),
    prisma.registration.count(),
    prisma.registration.groupBy({ by: ["attendeeEmail"] }),
    prisma.workshop.count({ where: { startsAt: { gte: lahoreMidnightUTC(0), lt: lahoreMidnightUTC(1) } } }),
    prisma.workshop.count({ where: { status: { in: ["PUBLISHED", "FULLY_BOOKED"] }, startsAt: { gte: now } } }),
    prisma.registration.findMany({
      include: { workshop: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <>
      <AdminHeader organizer={me} />
      <main className="flex-1 pb-16">
        <section className="container py-8">
          <div className="bubble-pill" aria-hidden="true">
            <div className="bubble-pill-tail" />
            <div className="bubble-pill-body">
              <h1 className="font-display text-lg font-bold text-bubble-ink">Platform overview</h1>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total workshops" value={workshops} />
            <StatCard label="Organizations" value={orgs} />
            <StatCard label="Organizers" value={organizers} />
            <StatCard label="Registrations" value={registrations} />
            <StatCard label="Unique attendee emails" value={uniqueEmails.length} />
            <StatCard label="Upcoming workshops" value={upcoming} />
            <StatCard label="Workshops today" value={todayWorkshops} />
            <StatCard label="Recent registrations" value={recent.length} hint="latest 10" />
          </div>

          <h2 className="mt-10 font-display text-xl font-bold text-ink">System status</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Alert variant="info">
              The platform sends no emails: attendees get their private access link in the browser immediately after
              registering. All workshops are online.
            </Alert>
            <div className="brand-card flex flex-wrap items-center gap-2 rounded-xl p-4">
              <span className="text-sm font-medium text-ink-muted">Database:</span>
              <Badge variant="mint">PostgreSQL (Prisma)</Badge>
              <span className="ml-2 text-sm font-medium text-ink-muted">Hosting target:</span>
              <Badge variant="bubble">Vercel</Badge>
              <span className="ml-2 text-sm font-medium text-ink-muted">Timezone:</span>
              <Badge variant="outline">Asia/Karachi</Badge>
            </div>
          </div>

          <h2 className="mt-10 font-display text-xl font-bold text-ink">Latest registrations</h2>
          <ul className="brand-card mt-4 divide-y divide-line/20 rounded-xl">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span className="font-medium text-ink">{r.attendeeEmail}</span>
                <span className="text-ink-muted">{r.workshop.title}</span>
                <span className="text-xs text-ink-soft">
                  {r.createdAt.toLocaleString("en-US", { timeZone: "Asia/Karachi", dateStyle: "short", timeStyle: "short" })} PKT
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
