import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import { WorkshopForm } from "@/components/admin/workshop-form";
import { requirePageOrganizer } from "@/lib/page-guards";
import { prisma } from "@/lib/db";
import { organizationOptions } from "../../form-helpers";
import { updateWorkshopAction } from "../../../actions/workshop-actions";
import { lahoreDecompose } from "@/lib/datetime";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit workshop", robots: { index: false } };

export default async function EditWorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organizer = await requirePageOrganizer("workshops:manage-own");

  const workshop = await prisma.workshop.findUnique({ where: { id } });
  if (!workshop) notFound();
  if (organizer.role !== "SUPER_ADMIN" && workshop.organizerId !== organizer.id) {
    notFound();
  }

  const orgs = await organizationOptions(organizer.organizationId, organizer.role);
  // Ensure the workshop's own org is selectable even if it changed.
  if (!orgs.some((o) => o.id === workshop.organizationId)) {
    const own = await prisma.organization.findUnique({
      where: { id: workshop.organizationId },
      select: { id: true, name: true, slug: true, isFeatured: true },
    });
    if (own) orgs.push(own);
  }

  const start = lahoreDecompose(workshop.startsAt);
  const end = lahoreDecompose(workshop.endsAt);

  return (
    <>
      <AdminHeader organizer={organizer} />
      <main className="flex-1 pb-16">
        <section className="container max-w-3xl py-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href={`/admin/workshops/${workshop.id}`}><ArrowLeft className="h-4 w-4" /> Back to workshop</Link>
          </Button>
          <div className="bubble-pill mb-6" aria-hidden="true">
            <div className="bubble-pill-tail" />
            <div className="bubble-pill-body">
              <h1 className="font-display text-lg font-bold text-bubble-ink">Edit workshop</h1>
            </div>
          </div>
          <WorkshopForm
            action={updateWorkshopAction}
            values={{
              id: workshop.id,
              title: workshop.title,
              description: workshop.description,
              date: start.date,
              startTime: start.time,
              endTime: end.time,
              format: workshop.format,
              location: workshop.location,
              capacity: workshop.capacity,
              meetingUrl: workshop.meetingUrl,
              coverImageUrl: workshop.coverImageUrl,
              status: workshop.status,
              organizationId: workshop.organizationId,
            }}
            organizations={orgs}
            submitLabel="Save changes"
            isSuperAdmin={organizer.role === "SUPER_ADMIN"}
          />
        </section>
      </main>
    </>
  );
}
