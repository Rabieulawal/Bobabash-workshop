import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/datetime";

/**
 * Reusable workshop queries shared by public pages and dashboards.
 */

export type WorkshopCardData = Awaited<ReturnType<typeof listWorkshops>>["workshops"][number];

const cardInclude = {
  organization: { select: { id: true, name: true, slug: true, isFeatured: true } },
  organizer: { select: { id: true, name: true } },
  _count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
} as const;

function wherePublic(query: {
  when: "upcoming" | "today" | "tomorrow" | "week";
  org?: string;
  q?: string;
}): Prisma.WorkshopWhereInput {
  const orgWhere: Prisma.OrganizationWhereInput | undefined = query.org
    ? query.org === "other-events"
      ? { isFeatured: false, status: "ACTIVE" }
      : { slug: query.org, status: "ACTIVE" }
    : undefined;

  return {
    status: { in: ["PUBLISHED", "FULLY_BOOKED"] },
    ...(orgWhere ? { organization: orgWhere } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
            { organization: { name: { contains: query.q, mode: "insensitive" } } },
            { organizer: { name: { contains: query.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

export async function listWorkshops(query: {
  when: "upcoming" | "today" | "tomorrow" | "week";
  org?: string;
  q?: string;
  sort: "soonest" | "popular" | "newest";
}) {
  const base = wherePublic(query);
  const orderBy =
    query.sort === "popular"
      ? [{ registrations: { _count: "desc" as const } }, { startsAt: "asc" as const }]
      : query.sort === "newest"
        ? [{ createdAt: "desc" as const }]
        : [{ startsAt: "asc" as const }];

  const workshops = await prisma.workshop.findMany({
    where: base,
    include: cardInclude,
    orderBy,
    take: 60,
  });

  // Post-filter calendar windows + registration-open state in one pass.
  const { workshopRangeFilter } = await import("@/lib/datetime");
  const range = workshopRangeFilter(query.when);
  const filtered = workshops.filter((w) => {
    const s = w.startsAt.getTime();
    if (range.startsAt && "gte" in range.startsAt && range.startsAt.gte && s < range.startsAt.gte.getTime()) return false;
    if (range.startsAt && "lt" in range.startsAt && range.startsAt.lt && s >= range.startsAt.lt.getTime()) return false;
    return true;
  });

  return { workshops: filtered };
}

export async function getPublicWorkshopBySlug(slug: string) {
  const workshop = await prisma.workshop.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "FULLY_BOOKED", "REGISTRATION_CLOSED", "CANCELLED", "COMPLETED"] } },
    include: {
      organization: { select: { name: true, slug: true, isFeatured: true } },
      organizer: { select: { name: true } },
      _count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
    },
  });
  return workshop;
}

export async function relatedWorkshops(orgId: string, excludeId: string, take = 3) {
  const now = new Date();
  return prisma.workshop.findMany({
    where: {
      organizationId: orgId,
      id: { not: excludeId },
      status: { in: ["PUBLISHED", "FULLY_BOOKED"] },
      startsAt: { gte: now },
    },
    include: cardInclude,
    orderBy: { startsAt: "asc" },
    take,
  });
}

export async function listOrganizationsPublic() {
  const orgs = await prisma.organization.findMany({
    where: { status: "ACTIVE" },
    include: {
      _count: { select: { workshops: { where: { status: { in: ["PUBLISHED", "FULLY_BOOKED"] } } } } },
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });
  return orgs;
}

export async function uniqueSlugFor(title: string, model: "workshop" | "organization"): Promise<string> {
  const base = slugify(title) || "workshop";
  for (let i = 0; i < 30; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const exists =
      model === "workshop"
        ? await prisma.workshop.findUnique({ where: { slug: candidate }, select: { id: true } })
        : await prisma.organization.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
