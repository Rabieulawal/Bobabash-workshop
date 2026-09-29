import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, CalendarDays, Users, Building2, Settings, LogOut, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/app/admin/actions/auth-actions";
import { hasPermission, PERMISSIONS } from "@/lib/auth";
import type { SessionOrganizer } from "@/lib/auth";

export function AdminHeader({ organizer }: { organizer: SessionOrganizer }) {
  const isSuper = organizer.role === "SUPER_ADMIN";
  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/admin/workshops", label: "Workshops", icon: CalendarDays, show: true },
    { href: "/admin/registrations", label: "Registrations", icon: Users, show: isSuper || hasPermission(organizer, PERMISSIONS.ATTENDEES_VIEW_OWN) },
    { href: "/admin/organizers", label: "Organizers", icon: ShieldCheck, show: isSuper || hasPermission(organizer, PERMISSIONS.ORGANIZERS_MANAGE) },
    { href: "/admin/organizations", label: "Organizations", icon: Building2, show: isSuper || hasPermission(organizer, PERMISSIONS.ORGANIZATIONS_MANAGE) },
    { href: "/admin/settings", label: "Settings", icon: Settings, show: isSuper },
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2 border-line bg-surface/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2" aria-label="Admin dashboard">
            <Image src="/cup.png" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="hidden font-display text-lg font-bold text-ink sm:inline">
              Boba Bash <span className="text-bubble-ink">Admin</span>
            </span>
          </Link>
          <nav aria-label="Admin navigation" className="hidden items-center gap-1 lg:flex">
            {navItems.filter((n) => n.show).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 font-display text-sm font-bold text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubble-ink"
              >
                <item.icon className="mr-1.5 inline h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/account" className="text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubble-ink rounded-md">
            <span className="block font-display text-sm font-bold text-ink">{organizer.name}</span>
            <span className="block text-xs text-ink-soft">@{organizer.username} · {organizer.role.replaceAll("_", " ").toLowerCase()}</span>
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bubble-ink"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
      {/* Mobile nav */}
      <nav aria-label="Admin mobile navigation" className="flex gap-1 overflow-x-auto border-t-2 border-line/20 px-4 py-2 lg:hidden">
        {navItems.filter((n) => n.show).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full border-2 border-line bg-surface px-3 py-1 font-display text-xs font-bold text-ink-muted hover:bg-surface-alt hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
