import Link from "next/link";
import Image from "next/image";
import { CalendarDays, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appUrl } from "@/lib/app-url";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-line bg-surface">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none" aria-label="Boba Bash Workshops home">
          <Image src="/cup.png" alt="" width={36} height={30} priority />
          <span className="hidden font-display text-xl font-bold text-ink min-[420px]:inline">
            Boba Bash <span className="text-bubble-ink">Workshops</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workshops">
              <CalendarDays className="h-4 w-4" /> <span className="hidden min-[420px]:inline">Workshops</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/login">
              <LogIn className="h-4 w-4" /> <span className="hidden min-[420px]:inline">Organizer login</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
