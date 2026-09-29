import { AdminHeader } from "@/components/admin/admin-header";
import { Badge } from "@/components/ui/badge";
import { requirePageOrganizer } from "@/lib/page-guards";
import { prisma } from "@/lib/db";
import {
  CreateOrganizerDialog,
  EditOrganizerDialog,
  ResetPasswordDialog,
  ToggleActiveButton,
} from "@/components/admin/organizer-dialogs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organizers", robots: { index: false } };

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ORGANIZER: "Organizer",
  WORKSHOP_MANAGER: "Workshop manager",
};

export default async function OrganizersPage() {
  const me = await requirePageOrganizer("organizers:manage");

  const [organizers, organizations] = await Promise.all([
    prisma.organizer.findMany({
      include: {
        organization: { select: { name: true } },
        _count: { select: { workshops: true } },
      },
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    }),
    prisma.organization.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <AdminHeader organizer={me} />
      <main className="flex-1 pb-16">
        <section className="container py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="bubble-pill" aria-hidden="true">
              <div className="bubble-pill-tail" />
              <div className="bubble-pill-body">
                <h1 className="font-display text-lg font-bold text-bubble-ink">Organizers</h1>
              </div>
            </div>
            <CreateOrganizerDialog organizations={organizations} />
          </div>

          <div className="brand-card mt-6 overflow-x-auto rounded-xl">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b-2 border-line text-left font-display text-xs font-bold uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3">Organizer</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Workshops</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizers.map((o) => (
                  <tr key={o.id} className="border-b border-line/20 last:border-0 hover:bg-surface-alt/60">
                    <td className="px-5 py-3.5">
                      <p className="font-display font-bold text-ink">{o.name}</p>
                      <p className="font-mono text-xs text-ink-soft">@{o.username}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={o.role === "SUPER_ADMIN" ? "golden" : "outline"}>{ROLE_LABEL[o.role]}</Badge>
                      {o.permissions.length > 0 ? (
                        <p className="mt-1 text-xs text-ink-soft">+{o.permissions.length} extra permission{o.permissions.length === 1 ? "" : "s"}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted">{o.organization?.name ?? "—"}</td>
                    <td className="px-5 py-3.5 text-ink-muted">{o._count.workshops}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={o.active ? "mint" : "muted"}>{o.active ? "Active" : "Disabled"}</Badge>
                      {o.mustChangePassword ? <p className="mt-1 text-xs text-goldenrod">temporary password</p> : null}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-0.5">
                        <EditOrganizerDialog
                          organizer={{
                            id: o.id, name: o.name, username: o.username, role: o.role,
                            organizationId: o.organizationId, permissions: o.permissions, active: o.active,
                          }}
                          organizations={organizations}
                        />
                        <ResetPasswordDialog organizerId={o.id} username={o.username} />
                        <ToggleActiveButton organizerId={o.id} active={o.active} username={o.username} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
