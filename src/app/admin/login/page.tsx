import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getOrganizerSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Organizer Login",
  robots: { index: false },
};

export default async function LoginPage() {
  const session = await getOrganizerSession();
  if (session) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-alt p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="bubble-pill" aria-hidden="true">
            <div className="bubble-pill-tail" />
            <div className="bubble-pill-body">
              <span className="font-display text-lg font-bold text-bubble-ink">Organizer login</span>
            </div>
          </div>
          <Image src="/logos/logofull.png" alt="Boba Bash Workshops" width={140} height={56} className="h-14 w-auto" priority />
        </div>
        <div className="brand-card rounded-xl p-6 sm:p-8">
          <h1 className="font-display text-xl font-bold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Sign in with the username and password your admin gave you.
          </p>
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-ink-soft">
          <Link href="/" className="hover:text-ink hover:underline">← Back to workshops</Link>
        </p>
      </div>
    </main>
  );
}
