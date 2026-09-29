import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Users2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePageOrganizer } from "@/lib/page-guards";
import { prisma } from "@/lib/db";
import { dayLabel, formatDate, formatTimeRange } from "@/lib/datetime";

export const dynamic = "force-dynamic";
export const metadata = { title: "Attendees", robots: { index: false } };

export default async function AttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organizer = await requirePageOrganizer("attendees:view-own");

  const workshop = await prisma.workshop.findUnique({
    where: { id },
    include: { organization: { select: { name: true } } },
  });
  if (!workshop) notFound();
  if (organizer.role !== "SUPER_ADMIN" && workshop.organizerId !== organizer.id) notFound();

  const registrations = await prisma.registration.findMany({
    where: { workshopId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, attendeeEmail: true, status: true, createdAt: true },
  });

  const confirmed = registrations.filter((r) => r.status === "CONFIRMED").length;

  return (
    <>
      <AdminHeader organizer={organizer} />
      <main className="flex-1 pb-16">
        <section className="container py-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href={`/admin/workshops/${id}`}><ArrowLeft className="h-4 w-4" /> Back to workshop</Link>
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="bubble-pill" aria-hidden="true">
                <div className="bubble-pill-tail" />
                <div className="bubble-pill-body">
                  <h1 className="font-display text-lg font-bold text-bubble-ink">Attendees</h1>
                </div>
              </div>
              <p className="mt-3 text-ink-muted">
                <span className="font-display font-bold text-ink">{workshop.title}</span> ·{" "}
                {dayLabel(workshop.startsAt)}, {formatDate(workshop.startsAt)} · {formatTimeRange(workshop.startsAt, workshop.endsAt)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {confirmed} confirmed{workshop.capacity != null ? ` of ${workshop.capacity}` : ""} · {registrations.length - confirmed} cancelled
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href={`/api/admin/workshops/${id}/attendees.csv`} download>
                <Download className="h-4 w-4" /> Export CSV
              </a>
            </Button>
          </div>

          {registrations.length === 0 ? (
            <EmptyState
              className="mt-6"
              title="No registrations yet"
              description="When people register with their email, they'll appear here."
              action={
                <Button variant="outline" asChild>
                  <Link href={`/workshops/${workshop.slug}`}>View public page</Link>
                </Button>
              }
            />
          ) : (
            <div className="brand-card mt-6 overflow-x-auto rounded-xl">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b-2 border-line text-left font-display text-xs font-bold uppercase tracking-wide text-ink-muted">
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Registered at</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r, i) => (
                    <tr key={r.id} className="border-b border-line/20 last:border-0 hover:bg-surface-alt/60">
                      <td className="px-5 py-3 text-ink-soft">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-ink">{r.attendeeEmail}</td>
                      <td className="px-5 py-3">
                        <Badge variant={r.status === "CONFIRMED" ? "mint" : "muted"}>
                          {r.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-ink-muted">
                        {r.createdAt.toLocaleString("en-US", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })} PKT
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
