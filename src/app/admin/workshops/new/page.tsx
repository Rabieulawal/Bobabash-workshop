import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import { WorkshopForm } from "@/components/admin/workshop-form";
import { requirePageOrganizer } from "@/lib/page-guards";
import { organizationOptions } from "../form-helpers";
import { createWorkshopAction } from "../../actions/workshop-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "New workshop", robots: { index: false } };

export default async function NewWorkshopPage() {
  const organizer = await requirePageOrganizer("workshops:manage-own");
  const orgs = await organizationOptions(organizer.organizationId, organizer.role);

  return (
    <>
      <AdminHeader organizer={organizer} />
      <main className="flex-1 pb-16">
        <section className="container max-w-3xl py-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/admin/workshops"><ArrowLeft className="h-4 w-4" /> Back to workshops</Link>
          </Button>
          <div className="bubble-pill mb-6" aria-hidden="true">
            <div className="bubble-pill-tail" />
            <div className="bubble-pill-body">
              <h1 className="font-display text-lg font-bold text-bubble-ink">New workshop</h1>
            </div>
          </div>
          <WorkshopForm
            action={createWorkshopAction}
            values={{ status: "DRAFT" }}
            organizations={orgs}
            submitLabel="Create workshop"
            isSuperAdmin={organizer.role === "SUPER_ADMIN"}
          />
        </section>
      </main>
    </>
  );
}
