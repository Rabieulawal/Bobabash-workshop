import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WorkshopCard } from "@/components/workshops/workshop-card";
import { WorkshopFilters } from "@/components/workshops/workshop-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { listWorkshops, listOrganizationsPublic } from "@/lib/workshops";
import { workshopQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Other Events",
  description: "Workshops from partner organizations and community events.",
};

export default async function OtherEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pick = (k: string) => (typeof params[k] === "string" ? params[k] : undefined);
  const query = workshopQuerySchema.parse({ ...{ org: "other-events" }, q: pick("q"), when: pick("when"), format: pick("format"), sort: pick("sort") });

  const [{ workshops }, orgs] = await Promise.all([listWorkshops(query), listOrganizationsPublic()]);
  if (!orgs.some((o) => !o.isFeatured)) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b-2 border-line bg-surface-alt">
          <div className="container py-12">
            <div className="bubble-pill" aria-hidden="true">
              <div className="bubble-pill-tail" />
              <div className="bubble-pill-body">
                <h1 className="font-display text-lg font-bold text-bubble-ink">Other Events</h1>
              </div>
            </div>
            <h2 className="mt-5 max-w-2xl font-display text-3xl font-bold text-ink sm:text-4xl">
              Workshops from our friends
            </h2>
            <p className="mt-2 max-w-2xl text-ink-muted">
              Coding clubs, AI meetups, school tech societies and other community organizations hosting workshops on the platform.
            </p>
          </div>
        </section>

        <section className="container py-8">
          <div className="brand-card mb-6 rounded-xl p-4">
            <WorkshopFilters organizations={orgs.map((o) => ({ slug: o.slug, name: o.name, isFeatured: o.isFeatured }))} />
          </div>
          {workshops.length === 0 ? (
            <EmptyState
              title="No upcoming partner workshops"
              description="Partner organizations haven't scheduled anything yet — check back soon!"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {workshops.map((w) => (
                <WorkshopCard
                  key={w.id}
                  workshop={{
                    slug: w.slug, title: w.title, description: w.description,
                    startsAt: w.startsAt, endsAt: w.endsAt, format: w.format, location: w.location,
                    status: w.status, organizationName: w.organization.name, organizationSlug: w.organization.slug,
                    organizerName: w.organizer.name, attendeeCount: w._count.registrations, capacity: w.capacity,
                    coverImageUrl: w.coverImageUrl,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
