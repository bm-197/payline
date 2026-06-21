import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Designed empty state: one serif-italic line plus a concrete next action.
 * e.g. line="No invoices yet." action=<Button>Bill your first client</Button>
 */
export function EmptyState({
  line,
  hint,
  action,
  className,
}: {
  line: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-3xl border border-line bg-card/60 px-6 py-16 text-center",
        className,
      )}
    >
      <p className="font-serif text-xl italic text-ink">{line}</p>
      {hint ? <p className="max-w-sm text-sm text-muted">{hint}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
