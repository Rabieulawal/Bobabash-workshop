import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WorkshopCard } from "@/components/workshops/workshop-card";
import { WorkshopFilters } from "@/components/workshops/workshop-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/db";
import { listWorkshops, listOrganizationsPublic } from "@/lib/workshops";
import { workshopQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) return { title: "Organization not found" };
  return { title: org.name, description: org.description ?? `Workshops by ${org.name}.` };
}

export default async function OrganizationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orgSlug } = await params;
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? sp[k] : undefined);
  const query = workshopQuerySchema.parse({ ...{ org: orgSlug }, q: pick("q"), when: pick("when"), sort: pick("sort") });

  const [{ workshops }, orgs] = await Promise.all([listWorkshops(query), listOrganizationsPublic()]);
  const org = orgs.find((o) => o.slug === orgSlug);
  if (!org) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b-2 border-line bg-surface-alt">
          <div className="container py-12">
            <div className="bubble-pill" aria-hidden="true">
              <div className="bubble-pill-tail" />
              <div className="bubble-pill-body">
                <h1 className="font-display text-lg font-bold text-bubble-ink">{org.name}</h1>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-lg text-ink-muted">
              {org.description ?? `Workshops hosted by ${org.name}.`}
            </p>
          </div>
        </section>

        <section className="container py-8">
          <div className="brand-card mb-6 rounded-xl p-4">
            <WorkshopFilters organizations={orgs.map((o) => ({ slug: o.slug, name: o.name, isFeatured: o.isFeatured }))} />
          </div>
          {workshops.length === 0 ? (
            <EmptyState title={`No upcoming ${org.name} workshops`} description="Check back soon!" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {workshops.map((w) => (
                <WorkshopCard
                  key={w.id}
                  workshop={{
                    slug: w.slug, title: w.title, description: w.description,
                    startsAt: w.startsAt, endsAt: w.endsAt,
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
