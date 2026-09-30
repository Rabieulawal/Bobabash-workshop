"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WHEN_OPTIONS = [
  { value: "upcoming", label: "All upcoming" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "week", label: "This week" },
];
const SORT_OPTIONS = [
  { value: "soonest", label: "Sort: Soonest" },
  { value: "popular", label: "Sort: Most popular" },
  { value: "newest", label: "Sort: Recently added" },
];

export function WorkshopFilters({
  organizations,
}: {
  organizations: { slug: string; name: string; isFeatured: boolean }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== "all" && !(key === "when" && value === "upcoming")) next.set(key, value);
      else next.delete(key);
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [params, pathname, router],
  );

  const hasFilters = Array.from(params.keys()).some((k) => params.get(k));

  return (
    <div className={cn("flex flex-col gap-3", isPending && "opacity-60")}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          update("q", q.trim());
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <Input
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search workshops or organizations…"
            aria-label="Search workshops"
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="default">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-ink-soft" aria-hidden="true" />
        <Select
          aria-label="Filter by date"
          value={params.get("when") ?? "upcoming"}
          onChange={(e) => update("when", e.target.value)}
          className="h-10 w-auto min-w-[130px] py-0"
        >
          {WHEN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by organization"
          value={params.get("org") ?? "all"}
          onChange={(e) => update("org", e.target.value === "all" ? "" : e.target.value)}
          className="h-10 w-auto min-w-[170px] py-0"
        >
          <option value="all">All organizations</option>
          <option value="boba-bash-lahore">Boba Bash Lahore</option>
          <option value="other-events">Other Events</option>
          {organizations
            .filter((o) => o.slug !== "boba-bash-lahore")
            .map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
        </Select>
        <Select
          aria-label="Sort workshops"
          value={params.get("sort") ?? "soonest"}
          onChange={(e) => update("sort", e.target.value)}
          className="h-10 w-auto min-w-[160px] py-0"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={() => startTransition(() => router.replace(pathname))}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
