import Link from "next/link";
import { Plus, Eye, Pencil, Users2, AlertTriangle } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/workshops/status-badge";
import { requirePageOrganizer } from "@/lib/page-guards";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { formatDateShort, formatTimeRange, lahoreMidnightUTC } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const organizer = await requirePageOrganizer();
  const sp = await searchParams;
  const forbidden = sp.error === "forbidden";

  const isSuper = organizer.role === "SUPER_ADMIN";
  const scope = isSuper ? {} : { organizerId: organizer.id };

  const now = new Date();
  const [
    upcomingCount,
    totalWorkshops,
    totalRegistrations,
    weekRegistrations,
    workshops,
  ] = await Promise.all([
    prisma.workshop.count({ where: { ...scope, status: { in: ["PUBLISHED", "FULLY_BOOKED"] }, startsAt: { gte: now } } }),
    prisma.workshop.count({ where: scope }),
    prisma.registration.count({ where: { status: "CONFIRMED", workshop: scope } }),
    prisma.registration.count({
      where: { status: "CONFIRMED", createdAt: { gte: new Date(now.getTime() - 7 * 86_400_000) }, workshop: scope },
    }),
    prisma.workshop.findMany({
      where: scope,
      include: {
        organization: { select: { name: true, slug: true } },
        _count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
      },
      orderBy: { startsAt: "asc" },
      take: 50,
    }),
  ]);

  const canManage = hasPermission(organizer, PERMISSIONS.WORKSHOPS_MANAGE_OWN);

  return (
    <>
      <AdminHeader organizer={organizer} />
      <main className="flex-1 pb-16">
        <section className="container py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="bubble-pill" aria-hidden="true">
              <div className="bubble-pill-tail" />
              <div className="bubble-pill-body">
                <h1 className="font-display text-lg font-bold text-bubble-ink">Dashboard</h1>
              </div>
            </div>
            {canManage ? (
              <Button asChild>
                <Link href="/admin/workshops/new">
                  <Plus className="h-4 w-4" /> New workshop
                </Link>
              </Button>
            ) : null}
          </div>

          {organizer.mustChangePassword ? (
            <div className="mt-5 flex items-start gap-3 rounded-lg border-2 border-goldenrod bg-goldenrod/20 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-ink" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-display font-bold text-ink">You&apos;re using a temporary password</p>
                <p className="text-ink-muted">
                  Change it now to keep your account secure.{" "}
                  <Link href="/admin/account" className="font-bold underline">Change password →</Link>
                </p>
              </div>
            </div>
          ) : null}

          {forbidden ? (
            <div className="mt-5 rounded-lg border-2 border-[#7c2d1f] bg-destructive/15 px-4 py-3 text-sm font-medium text-destructive">
              You don&apos;t have permission to view that page.
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Upcoming workshops" value={upcomingCount} />
            <StatCard label="Total workshops" value={totalWorkshops} />
            <StatCard label="Total registrations" value={totalRegistrations} />
            <StatCard label="Registrations this week" value={weekRegistrations} />
          </div>

          <h2 className="mt-10 font-display text-xl font-bold text-ink">Your workshops</h2>
          {workshops.length === 0 ? (
            <EmptyState
              className="mt-4"
              title="No workshops yet"
              description={canManage ? "Create your first workshop and start taking registrations." : "Workshops assigned to you will appear here."}
              action={
                canManage ? (
                  <Button asChild>
                    <Link href="/admin/workshops/new">
                      <Plus className="h-4 w-4" /> Create workshop
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="brand-card mt-4 overflow-x-auto rounded-xl">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b-2 border-line text-left font-display text-xs font-bold uppercase tracking-wide text-ink-muted">
                    <th className="px-5 py-3">Workshop</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Attendees</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workshops.map((w) => {
                    const upcoming = w.startsAt >= now && (w.status === "PUBLISHED" || w.status === "FULLY_BOOKED");
                    return (
                      <tr key={w.id} className="border-b border-line/20 last:border-0 hover:bg-surface-alt/60">
                        <td className="max-w-[280px] px-5 py-3.5">
                          <p className="truncate font-display font-bold text-ink">{w.title}</p>
                          <p className="text-xs text-ink-soft">{w.organization.name}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          {upcoming ? (
                            <span className="font-semibold text-ink">{formatDateShort(w.startsAt)}</span>
                          ) : (
                            <span className="text-ink-soft">{formatDateShort(w.startsAt)}</span>
                          )}
                          <p className="text-xs text-ink-soft">{formatTimeRange(w.startsAt, w.endsAt)}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          {w.capacity != null ? `${w._count.registrations} / ${w.capacity}` : w._count.registrations}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={w.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1.5">
                            <Button variant="ghost" size="sm" asChild aria-label={`View ${w.title}`}>
                              <Link href={`/admin/workshops/${w.id}`}><Eye className="h-4 w-4" /></Link>
                            </Button>
                            {canManage ? (
                              <>
                                <Button variant="ghost" size="sm" asChild aria-label={`Manage attendees of ${w.title}`}>
                                  <Link href={`/admin/workshops/${w.id}/attendees`}><Users2 className="h-4 w-4" /></Link>
                                </Button>
                                <Button variant="ghost" size="sm" asChild aria-label={`Edit ${w.title}`}>
                                  <Link href={`/admin/workshops/${w.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
