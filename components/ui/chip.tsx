import { cn } from "@/lib/cn";

/**
 * Invoice status chips. Text-first: the word always carries the meaning, color
 * never alone. "viewed" gets a distinct label from "sent" per the brief.
 */
export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue" | "void";

const styles: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-line/70 text-muted" },
  sent: { label: "Sent", className: "bg-peri text-ink" },
  viewed: { label: "Opened", className: "bg-peri-deep/50 text-ink" },
  paid: { label: "Paid", className: "bg-sage text-ink" },
  overdue: { label: "Overdue", className: "bg-blush text-ink" },
  void: { label: "Void", className: "bg-transparent text-faint ring-1 ring-line" },
};

export function StatusChip({ status, className }: { status: InvoiceStatus; className?: string }) {
  const s = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  );
}
