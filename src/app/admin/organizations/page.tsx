import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Badge } from "@/components/ui/badge";
import { requirePageOrganizer } from "@/lib/page-guards";
import { prisma } from "@/lib/db";
import { CreateOrganizationDialog, EditOrganizationDialog } from "@/components/admin/organization-dialogs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organizations", robots: { index: false } };

export default async function OrganizationsPage() {
  const me = await requirePageOrganizer("organizations:manage");

  const organizations = await prisma.organization.findMany({
    include: {
      _count: { select: { workshops: true, organizers: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <AdminHeader organizer={me} />
      <main className="flex-1 pb-16">
        <section className="container py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="bubble-pill" aria-hidden="true">
              <div className="bubble-pill-tail" />
              <div className="bubble-pill-body">
                <h1 className="font-display text-lg font-bold text-bubble-ink">Organizations</h1>
              </div>
            </div>
            <CreateOrganizationDialog />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {organizations.map((o) => (
              <div key={o.id} className="brand-card flex flex-col rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-ink">{o.name}</h3>
                      {o.isFeatured ? <Badge variant="bubble">Boba Bash</Badge> : null}
                      <Badge variant={o.status === "ACTIVE" ? "mint" : "muted"}>{o.status === "ACTIVE" ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{o.description ?? "No description."}</p>
                  </div>
                  <EditOrganizationDialog organization={o} />
                </div>
                <div className="mt-auto flex items-center justify-between pt-4 text-sm text-ink-muted">
                  <span>{o._count.workshops} workshops · {o._count.organizers} organizers</span>
                  <a
                    href={`/${o.slug}`}
                    className="inline-flex items-center gap-1 font-medium text-bubble-ink hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    /{o.slug} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
