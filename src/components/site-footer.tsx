import Link from "next/link";
import { SITE } from "@/lib/app-url";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-2 border-line bg-surface-alt">
      <div className="container flex flex-col items-center justify-between gap-3 py-6 text-sm text-ink-muted sm:flex-row">
        <p className="font-display font-bold text-ink">
          🧋 Boba Bash Workshops <span className="font-sans font-normal text-ink-soft">— community workshops, no accounts needed.</span>
        </p>
        <nav aria-label="Footer navigation" className="flex gap-4">
          <Link href="/workshops" className="hover:text-ink hover:underline">All workshops</Link>
          <Link href="/boba-bash-lahore" className="hover:text-ink hover:underline">Boba Bash Lahore</Link>
          <Link href="/other-events" className="hover:text-ink hover:underline">Other Events</Link>
        </nav>
      </div>
    </footer>
  );
}
