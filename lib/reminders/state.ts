import type { reminderState } from "@/lib/db/schema";
import type { StoredStatus } from "@/lib/invoices/state";

export type ReminderStateValue = (typeof reminderState.enumValues)[number];

/**
 * What to do with a single reminder when the cron sweep reaches it.
 *
 *   send  — invoice still open and the slot is due; email it, mark sent
 *   skip  — invoice already paid or void; mark skipped, never email
 *   noop  — not pending, or not due yet; leave it alone
 *
 * The cron sweep is idempotent because only "pending" reminders ever act, and
 * acting moves them out of "pending".
 */
export type ReminderAction = "send" | "skip" | "noop";

export function decideReminderAction(input: {
  reminderState: ReminderStateValue;
  invoiceStatus: StoredStatus;
  scheduledFor: Date;
  now: Date;
}): ReminderAction {
  if (input.reminderState !== "pending") return "noop";
  if (input.scheduledFor.getTime() > input.now.getTime()) return "noop";
  if (input.invoiceStatus === "paid" || input.invoiceStatus === "void") return "skip";
  return "send";
}

const TRANSITIONS: Record<ReminderStateValue, readonly ReminderStateValue[]> = {
  pending: ["sent", "skipped", "canceled"],
  sent: [],
  skipped: [],
  canceled: [],
};

export function canReminderTransition(from: ReminderStateValue, to: ReminderStateValue): boolean {
  return TRANSITIONS[from].includes(to);
}
