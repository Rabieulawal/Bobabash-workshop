import "server-only";
import { redirect } from "next/navigation";
import { getOrganizerSession, hasPermission, type SessionOrganizer, type Permission } from "@/lib/auth";

/** Session guard for admin pages: redirect to /admin/login when unauthenticated. */
export async function requirePageOrganizer(permission?: Permission): Promise<SessionOrganizer> {
  const organizer = await getOrganizerSession();
  if (!organizer) redirect("/admin/login");
  if (permission && !hasPermission(organizer, permission)) redirect("/admin?error=forbidden");
  return organizer;
}
