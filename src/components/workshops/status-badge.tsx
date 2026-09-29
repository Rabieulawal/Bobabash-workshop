import { Badge } from "@/components/ui/badge";
import type { WorkshopStatus } from "@prisma/client";

const STATUS_META: Record<string, { label: string; variant: "mint" | "bubble" | "golden" | "danger" | "muted" }> = {
  PUBLISHED: { label: "Registration open", variant: "mint" },
  FULLY_BOOKED: { label: "Fully booked", variant: "golden" },
  REGISTRATION_CLOSED: { label: "Registration closed", variant: "muted" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
  COMPLETED: { label: "Completed", variant: "muted" },
  DRAFT: { label: "Draft", variant: "muted" },
};

export function StatusBadge({ status }: { status: WorkshopStatus }) {
  const meta = STATUS_META[status] ?? { label: status, variant: "muted" as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
