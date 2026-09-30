import Link from "next/link";
import { Video, Users } from "lucide-react";
import type { WorkshopStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import { formatDateShort, formatTimeRange } from "@/lib/datetime";

export type WorkshopCardProps = {
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  status: WorkshopStatus;
  organizationName: string;
  organizationSlug: string;
  organizerName: string;
  attendeeCount: number;
  capacity: number | null;
  coverImageUrl?: string | null;
};

export function WorkshopCard({ workshop }: { workshop: WorkshopCardProps }) {
  const isFull = workshop.capacity != null && workshop.attendeeCount >= workshop.capacity;
  return (
    <Link
      href={`/workshops/${workshop.slug}`}
      className="group block focus-visible:outline-none"
      aria-label={`${workshop.title} — view details`}
    >
      <article className="brand-card flex h-full flex-col rounded-xl transition-transform group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-bubble-ink">
        {workshop.coverImageUrl ? (
          <img
            src={workshop.coverImageUrl}
            alt=""
            className="h-36 w-full rounded-t-[0.65rem] border-b-2 border-line object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold leading-tight text-ink group-hover:underline">
            {workshop.title}
          </h3>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{workshop.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-ink">
          <span>{formatDateShort(workshop.startsAt)}</span>
          <span className="text-ink-soft">·</span>
          <span>{formatTimeRange(workshop.startsAt, workshop.endsAt)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Video className="h-3.5 w-3.5" aria-hidden="true" /> Online workshop
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <Badge variant={workshop.organizationSlug === "boba-bash-lahore" ? "bubble" : "outline"}>
            {workshop.organizationName}
          </Badge>
          <StatusBadge status={workshop.status} />
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-caption text-ink-soft">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {isFull
            ? `${workshop.attendeeCount} going — full`
            : workshop.capacity != null
              ? `${workshop.attendeeCount} / ${workshop.capacity} going`
              : `${workshop.attendeeCount} going`}
          <span>· by {workshop.organizerName}</span>
        </div>
        </div>
      </article>
    </Link>
  );
}
