import type { InvoiceStatusValue } from "@/lib/db/schema";

/**
 * Invoice state machine.
 *
 * Stored statuses: draft, sent, viewed, paid, void. "overdue" is NOT stored — it
 * is derived at read time from (status in {sent, viewed}) plus a past due date.
 * An overdue invoice still becomes paid; overdue is a display state, not a node.
 *
 *   draft  -> sent, void
 *   sent   -> viewed, paid, void
 *   viewed -> paid, void
 *   paid   -> (terminal)
 *   void   -> (terminal)
 */

export type StoredStatus = InvoiceStatusValue;
export type DisplayStatus = StoredStatus | "overdue";

const TRANSITIONS: Record<StoredStatus, readonly StoredStatus[]> = {
  draft: ["sent", "void"],
  sent: ["viewed", "paid", "void"],
  viewed: ["paid", "void"],
  paid: [],
  void: [],
};

export function isTerminal(status: StoredStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function canTransition(from: StoredStatus, to: StoredStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: StoredStatus, to: StoredStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`invalid invoice transition: ${from} -> ${to}`);
  }
}

/** True when a sent/viewed invoice is past its due date (and so unpaid/unvoid). */
export function isOverdue(status: StoredStatus, dueDate: Date, now: Date): boolean {
  if (status !== "sent" && status !== "viewed") return false;
  return dueDate.getTime() < startOfDay(now).getTime();
}

/** The status to show in the UI, folding in the derived "overdue" state. */
export function displayStatus(status: StoredStatus, dueDate: Date, now: Date): DisplayStatus {
  return isOverdue(status, dueDate, now) ? "overdue" : status;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
