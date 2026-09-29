import Link from "next/link";
import { CalendarDays, Clock, MapPin, Video, ExternalLink, MailWarning } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CancelRegistrationButton } from "@/components/workshops/cancel-registration-button";
import { getAttendeeAccess } from "@/lib/auth";
import { formatDate, formatTimeRange, dayLabel } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Workshop",
  robots: { index: false },
};

export default async function AttendeePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const access = await getAttendeeAccess(token);

  if (!access) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1">
          <section className="container py-16">
            <div className="brand-card mx-auto max-w-lg rounded-xl p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-line bg-goldenrod/40">
                <MailWarning className="h-7 w-7 text-ink" aria-hidden="true" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold text-ink">Link not valid</h1>
              <p className="mt-2 text-ink-muted">
                This link has expired or doesn&apos;t exist. Request a fresh link below and we&apos;ll email it to you.
              </p>
              <Button className="mt-5" asChild>
                <Link href="/find-my-workshops">Email me a new link</Link>
              </Button>
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  const { workshop } = access;
  const cancelled = workshop.status === "CANCELLED";

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="container max-w-3xl py-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={workshop.organizationSlug === "boba-bash-lahore" ? "bubble" : "outline"}>
              {workshop.organizationName}
            </Badge>
            <Badge variant={cancelled ? "danger" : "mint"}>{cancelled ? "Cancelled" : "You're going ✓"}</Badge>
          </div>

          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink">{workshop.title}</h1>
          <p className="mt-1 text-ink-muted">Registered as <span className="font-semibold text-ink">{access.email}</span></p>

          {cancelled ? (
            <div className="brand-card mt-6 rounded-xl p-6 text-center">
              <p className="font-display text-xl font-bold text-destructive">This workshop was cancelled</p>
              <p className="mt-2 text-sm text-ink-muted">The organizer cancelled it. Keep an eye out for a new date.</p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href="/workshops">Browse other workshops</Link>
              </Button>
            </div>
          ) : (
            <>
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
                  {workshop.format === "ONLINE" ? (
                    <Video className="mt-0.5 h-5 w-5 text-bubble-ink" aria-hidden="true" />
                  ) : (
                    <MapPin className="mt-0.5 h-5 w-5 text-bubble-ink" aria-hidden="true" />
                  )}
                  <div>
                    <p className="font-display font-bold text-ink">{workshop.format === "ONLINE" ? "Online" : "In person"}</p>
                    <p className="text-sm text-ink-muted">
                      {workshop.format === "ONLINE"
                        ? workshop.meetingUrl
                          ? "Meeting link ready"
                          : "Meeting link: coming soon"
                        : workshop.location ?? "Location TBA"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-muted">
                {workshop.description}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {workshop.meetingUrl ? (
                  <Button size="lg" variant="bubble" asChild>
                    <a href={workshop.meetingUrl} target="_blank" rel="noopener noreferrer">
                      Join Workshop <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button size="lg" variant="bubble" disabled>
                    Meeting link: coming soon
                  </Button>
                )}
                {access.canCancel ? (
                  <CancelRegistrationButton token={token} />
                ) : null}
              </div>
              <p className="mt-3 text-xs text-ink-soft">
                This is your personal link — anyone with it can see your registration, so keep it private. It expires{" "}
                {access.tokenExpiresAt.toLocaleDateString("en-US", { timeZone: "Asia/Karachi", month: "long", day: "numeric" })}.
              </p>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
