import type { reminderKind } from "@/lib/db/schema";

export type ReminderKind = (typeof reminderKind.enumValues)[number];

export type ScheduledReminder = {
  kind: ReminderKind;
  scheduledFor: Date;
};

export function kindForOffset(offsetDays: number): ReminderKind {
  if (offsetDays < 0) return "before_due";
  if (offsetDays === 0) return "on_due";
  return "after_due";
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const r = startOfDay(d);
  r.setDate(r.getDate() + days);
  return r;
}

/**
 * Build the reminder rows to create when an invoice is sent. Each offset is a
 * number of days relative to the due date (negative = before). Duplicate offsets
 * are collapsed. Slots that already fall before the send day are dropped by
 * default (they would never fire), keeping the "exactly one per slot" promise.
 */
export function buildReminderSchedule(
  dueDate: Date,
  offsetDays: number[],
  sentAt: Date,
  opts: { includePast?: boolean } = {},
): ScheduledReminder[] {
  const sendDay = startOfDay(sentAt);
  const seen = new Set<number>();
  const out: ScheduledReminder[] = [];

  for (const offset of offsetDays) {
    if (!Number.isInteger(offset) || seen.has(offset)) continue;
    seen.add(offset);
    const scheduledFor = addDays(dueDate, offset);
    if (!opts.includePast && scheduledFor.getTime() < sendDay.getTime()) continue;
    out.push({ kind: kindForOffset(offset), scheduledFor });
  }

  out.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  return out;
}
