import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WorkshopCard } from "@/components/workshops/workshop-card";
import { WorkshopFilters } from "@/components/workshops/workshop-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { listWorkshops, listOrganizationsPublic } from "@/lib/workshops";
import { workshopQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "All Workshops",
  description: "Browse every upcoming community workshop — all online, all free to join.",
};

export default async function WorkshopsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pick = (k: string) => (typeof params[k] === "string" ? params[k] : undefined);
  const query = workshopQuerySchema.parse({
    q: pick("q"),
    when: pick("when"),
    org: pick("org"),
    sort: pick("sort"),
  });

  const [{ workshops }, orgs] = await Promise.all([listWorkshops(query), listOrganizationsPublic()]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b-2 border-line bg-surface-alt">
          <div className="container py-10">
            <div className="bubble-pill" aria-hidden="true">
              <div className="bubble-pill-tail" />
              <div className="bubble-pill-body">
                <h1 className="font-display text-lg font-bold text-bubble-ink">All Workshops</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-ink-muted">
              Every upcoming workshop across Boba Bash Lahore and partner events — all online. Search, filter, and
              register with just your email; your private access link appears instantly.
            </p>
          </div>
        </section>

        <section className="container py-8">
          <div className="brand-card mb-6 rounded-xl p-4">
            <WorkshopFilters organizations={orgs.map((o) => ({ slug: o.slug, name: o.name, isFeatured: o.isFeatured }))} />
          </div>

          {workshops.length === 0 ? (
            <EmptyState
              title="No workshops found"
              description={
                query.q
                  ? `Nothing matches "${query.q}". Try a different search or clear the filters.`
                  : "No upcoming workshops match these filters."
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {workshops.map((w) => (
                <WorkshopCard
                  key={w.id}
                  workshop={{
                    slug: w.slug,
                    title: w.title,
                    description: w.description,
                    startsAt: w.startsAt,
                    endsAt: w.endsAt,
                    status: w.status,
                    organizationName: w.organization.name,
                    organizationSlug: w.organization.slug,
                    organizerName: w.organizer.name,
                    attendeeCount: w._count.registrations,
                    capacity: w.capacity,
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
