import { prisma } from "@/lib/db";

/**
 * Workshop form data helper shared by the new/edit workshop
 * pages and their client form component.
 */
export async function organizationOptions(organizerOrganizationId: string | null, role: string) {
  const orgs = await prisma.organization.findMany({
    where: role === "SUPER_ADMIN" ? { status: "ACTIVE" } : { id: organizerOrganizationId ?? "__none__", status: "ACTIVE" },
    select: { id: true, name: true, slug: true, isFeatured: true },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });
  return orgs;
}
