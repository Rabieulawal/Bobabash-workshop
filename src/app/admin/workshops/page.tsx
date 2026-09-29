import Link from "next/link";
import { Plus, Eye, Pencil, Users2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/workshops/status-badge";
import { requirePageOrganizer } from "@/lib/page-guards";
import { prisma } from "@/lib/db";
import { hasPermission, PERMISSIONS } from "@/lib/auth";
import { formatDateShort, formatTimeRange } from "@/lib/datetime";

export const dynamic = "force-dynamic";
export const metadata = { title: "Workshops", robots: { index: false } };

export default async function AdminWorkshopsPage() {
  const organizer = await requirePageOrganizer();
  const scope = organizer.role === "SUPER_ADMIN" ? {} : { organizerId: organizer.id };

  const workshops = await prisma.workshop.findMany({
    where: scope,
    include: {
      organization: { select: { name: true } },
      _count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
    },
    orderBy: { startsAt: "desc" },
    take: 200,
  });

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
                <h1 className="font-display text-lg font-bold text-bubble-ink">Workshops</h1>
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

          {workshops.length === 0 ? (
            <EmptyState
              className="mt-6"
              title="No workshops yet"
              description="Workshops you create (or that are assigned to you) will show up here."
              action={
                canManage ? (
                  <Button asChild>
                    <Link href="/admin/workshops/new"><Plus className="h-4 w-4" /> Create workshop</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="brand-card mt-6 overflow-x-auto rounded-xl">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b-2 border-line text-left font-display text-xs font-bold uppercase tracking-wide text-ink-muted">
                    <th className="px-5 py-3">Workshop</th>
                    <th className="px-5 py-3">Organization</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Attendees</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workshops.map((w) => (
                    <tr key={w.id} className="border-b border-line/20 last:border-0 hover:bg-surface-alt/60">
                      <td className="max-w-[260px] px-5 py-3.5">
                        <p className="truncate font-display font-bold text-ink">{w.title}</p>
                        <p className="truncate font-mono text-xs text-ink-soft">/workshops/{w.slug}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline">{w.organization.name}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {formatDateShort(w.startsAt)}
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
                              <Button variant="ghost" size="sm" asChild aria-label={`Attendees of ${w.title}`}>
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
