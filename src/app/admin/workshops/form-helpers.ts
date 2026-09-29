import { prisma } from "@/lib/db";
import { slugify } from "@/lib/datetime";

/**
 * Workshop form data + permission helpers shared by the
 * new/edit workshop pages and their client form component.
 */
export async function organizationOptions(organizerOrganizationId: string | null, role: string) {
  const orgs = await prisma.organization.findMany({
    where: role === "SUPER_ADMIN" ? { status: "ACTIVE" } : { id: organizerOrganizationId ?? "__none__", status: "ACTIVE" },
    select: { id: true, name: true, slug: true, isFeatured: true },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });
  return orgs;
}

export function statusOptions() {
  return [
    { value: "DRAFT", label: "Draft — hidden from public" },
    { value: "PUBLISHED", label: "Published — registration open" },
    { value: "REGISTRATION_CLOSED", label: "Registration closed" },
    { value: "FULLY_BOOKED", label: "Fully booked" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "COMPLETED", label: "Completed" },
  ];
}

export function slugPreview(title: string): string {
  return slugify(title) || "your-workshop";
}
