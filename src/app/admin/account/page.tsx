import { AdminHeader } from "@/components/admin/admin-header";
import { ChangePasswordForm } from "./change-password-form";
import { requirePageOrganizer } from "@/lib/page-guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const organizer = await requirePageOrganizer();

  return (
    <>
      <AdminHeader organizer={organizer} />
      <main className="flex-1 pb-16">
        <section className="container max-w-lg py-8">
          <div className="bubble-pill mb-6" aria-hidden="true">
            <div className="bubble-pill-tail" />
            <div className="bubble-pill-body">
              <h1 className="font-display text-lg font-bold text-bubble-ink">My account</h1>
            </div>
          </div>

          <div className="brand-card mb-5 rounded-xl p-5 text-sm">
            <p><span className="font-display font-bold text-ink">Name:</span> {organizer.name}</p>
            <p className="mt-1"><span className="font-display font-bold text-ink">Username:</span> <span className="font-mono">@{organizer.username}</span></p>
            <p className="mt-1"><span className="font-display font-bold text-ink">Role:</span> {organizer.role.replaceAll("_", " ").toLowerCase()}</p>
          </div>

          <ChangePasswordForm mustChangePassword={organizer.mustChangePassword} />
        </section>
      </main>
    </>
  );
}
