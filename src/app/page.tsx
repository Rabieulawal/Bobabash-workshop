import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkshopCard } from "@/components/workshops/workshop-card";
import { WorkshopFilters } from "@/components/workshops/workshop-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { listWorkshops, listOrganizationsPublic } from "@/lib/workshops";
import { workshopQuerySchema } from "@/lib/validation";
import { lahoreMidnightUTC, formatTimeRange } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = workshopQuerySchema.parse({
    q: typeof params.q === "string" ? params.q : undefined,
    when: typeof params.when === "string" ? params.when : undefined,
    org: typeof params.org === "string" ? params.org : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
  });

  const [{ workshops }, orgs] = await Promise.all([listWorkshops(query), listOrganizationsPublic()]);
  const featured = orgs.find((o) => o.isFeatured);
  const others = orgs.filter((o) => !o.isFeatured);

  const today = workshops.filter((w) => w.startsAt >= lahoreMidnightUTC(0) && w.startsAt < lahoreMidnightUTC(1));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b-2 border-line bg-surface-alt">
          <div className="container flex flex-col gap-6 py-12 sm:py-16">
            <div className="bubble-pill self-start" aria-hidden="true">
              <div className="bubble-pill-tail" />
              <div className="bubble-pill-body">
                <span className="font-display text-lg font-bold text-bubble-ink">Workshops</span>
              </div>
            </div>
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Learn something new at <span className="text-bubble-ink">Boba Bash</span> 🧋
            </h1>
            <p className="max-w-2xl text-lg text-ink-muted">
              Live online workshops and community events. Pick one, enter your email — your private
              access link appears right away. No account needed.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/workshops">
                  Browse all workshops <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="gradient" asChild>
                <Link href="/boba-bash-lahore">Boba Bash Lahore workshops</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Two primary options */}
        <section className="container py-10" aria-labelledby="org-heading">
          <div className="bubble-pill mb-6" aria-hidden="true">
            <div className="bubble-pill-tail" />
            <div className="bubble-pill-body">
              <h2 id="org-heading" className="font-display text-lg font-bold text-bubble-ink">
                Who&apos;s hosting?
              </h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {featured ? (
              <Link href={`/${featured.slug}`} className="group focus-visible:outline-none">
                <div className="brand-card flex h-full flex-col rounded-xl border-bubble-ink bg-bubble/30 p-6 transition-transform group-hover:-translate-y-0.5">
                  <Badge variant="bubble" className="w-fit">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Boba Bash Lahore
                  </Badge>
                  <h3 className="mt-3 font-display text-2xl font-bold text-ink group-hover:underline">
                    {featured.name}
                  </h3>
                  <p className="mt-1 flex-1 text-ink-muted">
                    {featured.description ?? "The original boba-fueled community."}
                  </p>
                  <p className="mt-3 font-display font-bold text-bubble-ink">
                    {featured._count.workshops} upcoming workshop{featured._count.workshops === 1 ? "" : "s"} →
                  </p>
                </div>
              </Link>
            ) : null}
            <Link href="/other-events" className="group focus-visible:outline-none">
              <div className="brand-card flex h-full flex-col rounded-xl p-6 transition-transform group-hover:-translate-y-0.5">
                <Badge className="w-fit">Other Events</Badge>
                <h3 className="mt-3 font-display text-2xl font-bold text-ink group-hover:underline">
                  Other Events
                </h3>
                <p className="mt-1 flex-1 text-ink-muted">
                  Workshops from partner organizations — coding clubs, AI meetups, school tech societies and more.
                </p>
                <p className="mt-3 font-display font-bold text-ink-soft">
                  {others.reduce((acc, o) => acc + o._count.workshops, 0)} upcoming workshop
                  {others.reduce((acc, o) => acc + o._count.workshops, 0) === 1 ? "" : "s"} →
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Workshops with search & filters */}
        <section className="container pb-14" aria-labelledby="upcoming-heading">
          <div className="bubble-pill mb-6" aria-hidden="true">
            <div className="bubble-pill-tail" />
            <div className="bubble-pill-body">
              <h2 id="upcoming-heading" className="font-display text-lg font-bold text-bubble-ink">
                {query.when === "today" ? "Today's workshops" : "Upcoming workshops"}
              </h2>
            </div>
          </div>

          <div className="brand-card mb-6 rounded-xl p-4">
            <WorkshopFilters organizations={orgs.map((o) => ({ slug: o.slug, name: o.name, isFeatured: o.isFeatured }))} />
          </div>

          {today.length > 0 ? (
            <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border-2 border-goldenrod bg-goldenrod/20 px-4 py-2.5 text-sm font-semibold text-ink">
              <Sparkles className="h-4 w-4 text-goldenrod" aria-hidden="true" />
              {today.length} workshop{today.length === 1 ? "" : "s"} happening today
            </div>
          ) : null}

          {workshops.length === 0 ? (
            <EmptyState
              title="No workshops found"
              description={
                query.q
                  ? `Nothing matches "${query.q}". Try a different search or clear the filters.`
                  : "No upcoming workshops right now — check back soon or clear your filters."
              }
              action={
                <Button variant="outline" asChild>
                  <Link href="/workshops">See all workshops</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {workshops.slice(0, 9).map((w) => (
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

          {workshops.length > 9 ? (
            <div className="mt-8 text-center">
              <Button variant="outline" asChild>
                <Link href="/workshops">
                  View all {workshops.length} workshops <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
