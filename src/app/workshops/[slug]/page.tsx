import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Video, Users, ArrowLeft, ExternalLink, Lock, CircleCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkshopCard } from "@/components/workshops/workshop-card";
import { RegisterForm } from "@/components/workshops/register-form";
import { StatusBadge } from "@/components/workshops/status-badge";
import { getPublicWorkshopBySlug, relatedWorkshops } from "@/lib/workshops";
import { dayLabel, formatDate, formatTimeRange, isRegistrationOpen } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const workshop = await getPublicWorkshopBySlug(slug);
  if (!workshop) return { title: "Workshop not found" };
  return {
    title: workshop.title,
    description: `${workshop.description.slice(0, 150)} — ${dayLabel(workshop.startsAt)}, by ${workshop.organization.name}.`,
    openGraph: {
      title: `${workshop.title} · Boba Bash Workshops`,
      description: workshop.description.slice(0, 200),
      type: "article",
    },
  };
}

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workshop = await getPublicWorkshopBySlug(slug);
  if (!workshop) notFound();

  const attendeeCount = workshop._count.registrations;
  const open = isRegistrationOpen(workshop, attendeeCount, workshop.capacity);
  const spotsLeft = workshop.capacity != null ? workshop.capacity - attendeeCount : null;
  const isUpcoming = workshop.startsAt > new Date();
  const related = await relatedWorkshops(workshop.organizationId, workshop.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: workshop.title,
    description: workshop.description,
    startDate: workshop.startsAt.toISOString(),
    endDate: workshop.endsAt.toISOString(),
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus:
      workshop.status === "CANCELLED" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    location: { "@type": "VirtualLocation", url: workshop.meetingUrl ?? undefined },
    organizer: { "@type": "Organization", name: workshop.organization.name },
    maximumAttendeeCapacity: workshop.capacity ?? undefined,
  };

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <section className="container py-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/workshops">
              <ArrowLeft className="h-4 w-4" /> All workshops
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Main column */}
            <article>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={workshop.organization.isFeatured ? "bubble" : "outline"}>
                  {workshop.organization.name}
                </Badge>
                <StatusBadge status={workshop.status} />
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
                {workshop.title}
              </h1>
              <p className="mt-1.5 text-ink-soft">Hosted by {workshop.organizer.name}</p>

              {workshop.coverImageUrl ? (
                <div className="brand-card mt-6 overflow-hidden rounded-xl">
                  {/* Remote https images only (validated on input); unoptimized for arbitrary hosts. */}
                  <img
                    src={workshop.coverImageUrl}
                    alt=""
                    className="h-56 w-full object-cover sm:h-72"
                    loading="lazy"
                  />
                </div>
              ) : null}

              <div className="brand-card mt-6 grid gap-4 rounded-xl p-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 text-bubble-ink" aria-hidden="true" />
                  <div>
                    <p className="font-display font-bold text-ink">{dayLabel(workshop.startsAt)}</p>
                    <p className="text-sm text-ink-muted">{formatDate(workshop.startsAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-bubble-ink" aria-hidden="true" />
                  <div>
                    <p className="font-display font-bold text-ink">{formatTimeRange(workshop.startsAt, workshop.endsAt)}</p>
                    <p className="text-sm text-ink-muted">Pakistan Standard Time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Video className="mt-0.5 h-5 w-5 text-bubble-ink" aria-hidden="true" />
                  <div>
                    <p className="font-display font-bold text-ink">Online workshop</p>
                    <p className="text-sm text-ink-muted">
                      {workshop.meetingUrl ? "Meeting link available" : "Meeting link: coming soon"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 text-bubble-ink" aria-hidden="true" />
                  <div>
                    <p className="font-display font-bold text-ink">
                      {workshop.capacity != null
                        ? `${attendeeCount} / ${workshop.capacity} going`
                        : `${attendeeCount} going`}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {spotsLeft != null && spotsLeft > 0 && open
                        ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`
                        : workshop.capacity != null && attendeeCount >= workshop.capacity
                          ? "Fully booked"
                          : "Everyone welcome"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-ink">About this workshop</h2>
                <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-muted">
                  {workshop.description}
                </div>
              </div>
            </article>

            {/* Registration sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="brand-card rounded-xl p-6">
                {workshop.status === "CANCELLED" ? (
                  <div className="text-center">
                    <p className="font-display text-xl font-bold text-destructive">Cancelled</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      This workshop has been cancelled by the organizer. Browse other workshops to find another session.
                    </p>
                    <Button className="mt-4 w-full" variant="outline" asChild>
                      <Link href="/workshops">Browse workshops</Link>
                    </Button>
                  </div>
                ) : workshop.status === "COMPLETED" ? (
                  <div className="text-center">
                    <p className="font-display text-xl font-bold text-ink-soft">Completed</p>
                    <p className="mt-2 text-sm text-ink-muted">This workshop has already taken place.</p>
                  </div>
                ) : open ? (
                  <>
                    <h2 className="font-display text-xl font-bold text-ink">Join this workshop</h2>
                    <p className="mt-1 text-sm text-ink-muted">
                      Enter your email — no account, no password. Your private access link appears instantly.
                    </p>
                    <div className="mt-4">
                      <RegisterForm slug={workshop.slug} registrationOpen={open} />
                    </div>
                  </>
                ) : workshop.status === "FULLY_BOOKED" || (workshop.capacity != null && attendeeCount >= workshop.capacity) ? (
                  <div className="text-center">
                    <p className="font-display text-xl font-bold text-ink">Fully booked 🧋</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      All {workshop.capacity} spots are taken. Check out similar workshops below.
                    </p>
                    <div className="mt-5 border-t-2 border-dashed border-line/30 pt-4 text-left">
                      <p className="font-display font-bold text-ink">Already registered?</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        You can still get back to your spot with your access link.
                      </p>
                      <div className="mt-3">
                        <RegisterForm slug={workshop.slug} registrationOpen={false} variant="recover" />
                      </div>
                    </div>
                    <Button className="mt-4 w-full" variant="outline" asChild>
                      <Link href="/workshops">Browse workshops</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-display text-xl font-bold text-ink flex items-center justify-center gap-2">
                      <Lock className="h-5 w-5" aria-hidden="true" /> Registration closed
                    </p>
                    <p className="mt-2 text-sm text-ink-muted">
                      New registrations are closed for this workshop.
                    </p>
                    <div className="mt-5 border-t-2 border-dashed border-line/30 pt-4 text-left">
                      <p className="font-display font-bold text-ink">Already registered?</p>
                      <div className="mt-3">
                        <RegisterForm slug={workshop.slug} registrationOpen={false} variant="recover" />
                      </div>
                    </div>
                    <Button className="mt-4 w-full" variant="outline" asChild>
                      <Link href="/workshops">Browse workshops</Link>
                    </Button>
                  </div>
                )}

                {workshop.meetingUrl && workshop.status !== "DRAFT" ? (
                  <div className="mt-5 border-t-2 border-dashed border-line/30 pt-4">
                    {open || ["FULLY_BOOKED", "REGISTRATION_CLOSED", "COMPLETED"].includes(workshop.status) ? (
                      <Button className="w-full" variant="bubble" asChild>
                        <a href={workshop.meetingUrl} target="_blank" rel="noopener noreferrer">
                          Join Workshop <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <p className="text-center text-sm text-ink-soft">
                        <CircleCheck className="mr-1 inline h-4 w-4" aria-hidden="true" />
                        Meeting link is shared with registered attendees
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>

          {/* Related */}
          {related.length > 0 ? (
            <section className="mt-14" aria-labelledby="related-heading">
              <div className="bubble-pill mb-6" aria-hidden="true">
                <div className="bubble-pill-tail" />
                <div className="bubble-pill-body">
                  <h2 id="related-heading" className="font-display text-lg font-bold text-bubble-ink">
                    More from {workshop.organization.name}
                  </h2>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((w) => (
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
            </section>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
