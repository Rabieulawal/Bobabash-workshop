import Link from "next/link";
import { CupSoda } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="container py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-bubble-ink bg-bubble">
            <CupSoda className="h-10 w-10 text-bubble-ink" aria-hidden="true" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-ink">This page ran dry 🧋</h1>
          <p className="mx-auto mt-2 max-w-md text-ink-muted">
            We couldn&apos;t find what you were looking for. The workshop may have been removed or the link is wrong.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link href="/workshops">Browse workshops</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back home</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
