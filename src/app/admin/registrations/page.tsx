import { AdminHeader } from "@/components/admin/admin-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/admin/stat-card";
import { requirePageOrganizer } from "@/lib/page-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registrations", robots: { index: false } };

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requirePageOrganizer("attendees:view-own");
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email.toLowerCase().trim() : "";

  const where = email ? { attendeeEmail: { contains: email } } : {};

  const [total, confirmed, cancelled, uniqueEmails, registrations] = await Promise.all([
    prisma.registration.count({ where }),
    prisma.registration.count({ where: { ...where, status: "CONFIRMED" } }),
    prisma.registration.count({ where: { ...where, status: "CANCELLED" } }),
    prisma.registration.groupBy({ by: ["attendeeEmail"], where, _count: true }),
    prisma.registration.findMany({
      where,
      include: { workshop: { select: { title: true, slug: true, organization: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
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
              <h1 className="font-display text-lg font-bold text-bubble-ink">Registrations</h1>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total registrations" value={total} />
            <StatCard label="Confirmed" value={confirmed} />
            <StatCard label="Cancelled" value={cancelled} />
            <StatCard label="Unique emails" value={uniqueEmails.length} />
          </div>

          <form className="brand-card mt-6 flex gap-2 rounded-xl p-4" role="search">
            <input
              type="search"
              name="email"
              defaultValue={email}
              placeholder="Search by attendee email…"
              aria-label="Search by attendee email"
              className="brand-input flex-1"
            />
            <Button type="submit" variant="outline">Search</Button>
          </form>

          {registrations.length === 0 ? (
            <EmptyState className="mt-6" title="No registrations found" description={email ? `Nothing for "${email}".` : "Registrations will appear here as attendees sign up."} />
          ) : (
            <div className="brand-card mt-6 overflow-x-auto rounded-xl">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b-2 border-line text-left font-display text-xs font-bold uppercase tracking-wide text-ink-muted">
                    <th className="px-5 py-3">Attendee</th>
                    <th className="px-5 py-3">Workshop</th>
                    <th className="px-5 py-3">Organization</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id} className="border-b border-line/20 last:border-0 hover:bg-surface-alt/60">
                      <td className="px-5 py-3.5 font-medium text-ink">{r.attendeeEmail}</td>
                      <td className="max-w-[220px] truncate px-5 py-3.5">
                        <a href={`/workshops/${r.workshop.slug}`} className="text-bubble-ink hover:underline">{r.workshop.title}</a>
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted">{r.workshop.organization.name}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={r.status === "CONFIRMED" ? "mint" : "muted"}>
                          {r.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-ink-muted">
                        {r.createdAt.toLocaleString("en-US", { timeZone: "Asia/Karachi", dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
