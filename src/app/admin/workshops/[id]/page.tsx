import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Users2, Pencil, Globe } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/workshops/status-badge";
import {
  MeetingLinkPanel,
  ReschedulePanel,
  RegistrationTogglePanel,
  StatusActions,
} from "@/components/admin/workshop-manage-panel";
import { requirePageOrganizer } from "@/lib/page-guards";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { dayLabel, formatDate, formatTimeRange, lahoreDecompose } from "@/lib/datetime";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage workshop", robots: { index: false } };

export default async function ManageWorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organizer = await requirePageOrganizer("workshops:manage-own");

  const workshop = await prisma.workshop.findUnique({
    where: { id },
    include: {
      organization: { select: { name: true, slug: true } },
      organizer: { select: { name: true, username: true } },
      _count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
    },
  });
  if (!workshop) notFound();
  if (organizer.role !== "SUPER_ADMIN" && workshop.organizerId !== organizer.id) notFound();

  const start = lahoreDecompose(workshop.startsAt);
  const end = lahoreDecompose(workshop.endsAt);
  const confirmed = workshop._count.registrations;
  const isDraft = workshop.status === "DRAFT";

  return (
    <>
      <AdminHeader organizer={organizer} />
      <main className="flex-1 pb-16">
        <section className="container py-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/admin/workshops"><ArrowLeft className="h-4 w-4" /> All workshops</Link>
          </Button>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{workshop.organization.name}</Badge>
                <StatusBadge status={workshop.status} />
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">{workshop.title}</h1>
              <p className="mt-1 text-sm text-ink-muted">
                {dayLabel(workshop.startsAt)}, {formatDate(workshop.startsAt)} · {formatTimeRange(workshop.startsAt, workshop.endsAt)} ·{" "}
                {workshop.format === "ONLINE" ? "Online" : workshop.location ?? "In person"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/admin/workshops/${workshop.id}/attendees`}>
                  <Users2 className="h-4 w-4" /> Attendees ({confirmed})
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/admin/workshops/${workshop.id}/edit`}>
                  <Pencil className="h-4 w-4" /> Edit details
                </Link>
              </Button>
              {!isDraft ? (
                <Button variant="bubble" asChild>
                  <a href={`/workshops/${workshop.slug}`} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" /> Public page <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {isDraft ? (
            <p className="mt-4 rounded-lg border-2 border-goldenrod bg-goldenrod/20 px-4 py-2.5 text-sm font-medium text-ink">
              This workshop is a draft — it&apos;s hidden from the public until you publish it from Edit details.
            </p>
          ) : null}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <MeetingLinkPanel id={workshop.id} meetingUrl={workshop.meetingUrl} />
            <ReschedulePanel id={workshop.id} date={start.date} startTime={start.time} endTime={end.time} />
            <RegistrationTogglePanel id={workshop.id} manualClosed={workshop.manualClosed} />
            <StatusActions id={workshop.id} current={workshop.status} canDelete={isDraft && confirmed === 0} />
          </div>

          <div className="brand-card mt-5 rounded-xl p-5 text-sm text-ink-muted">
            <p><span className="font-display font-bold text-ink">Organizer:</span> {workshop.organizer.name} (@{workshop.organizer.username})</p>
            <p className="mt-1">
              <span className="font-display font-bold text-ink">Capacity:</span>{" "}
              {workshop.capacity != null ? `${confirmed} / ${workshop.capacity} registered` : "Unlimited"} ·{" "}
              <span className="font-display font-bold text-ink">Public URL:</span>{" "}
              <span className="font-mono text-xs">{appUrl}/workshops/{workshop.slug}</span>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
