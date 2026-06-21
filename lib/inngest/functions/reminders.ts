import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { businessProfile, invoice, reminder } from "@/lib/db/schema";
import { runReminderSlot } from "@/lib/reminders/process";
import { buildReminderSchedule } from "@/lib/reminders/schedule";
import { type InvoiceSentData, inngest } from "../client";

/**
 * Durable reminder run. On invoice/sent we materialize the schedule as reminder
 * rows (idempotently), then sleep until each slot and send. The run is canceled
 * the moment the invoice is paid or voided, so no reminder fires after close.
 *
 * Idempotency comes from three places: one run per invoice (idempotency key),
 * Inngest's exactly-once step memoization, and a "still pending" guard on every
 * row update, so a slot can never send twice.
 */
export const sendInvoiceReminders = inngest.createFunction(
  {
    id: "send-invoice-reminders",
    idempotency: "event.data.invoiceId",
    triggers: [{ event: "invoice/sent" }],
    cancelOn: [
      { event: "invoice/paid", match: "data.invoiceId" },
      { event: "invoice/voided", match: "data.invoiceId" },
    ],
  },
  async ({ event, step }) => {
    const { invoiceId } = event.data as InvoiceSentData;

    const slots = await step.run("ensure-reminders", async () => {
      const inv = await db.query.invoice.findFirst({ where: eq(invoice.id, invoiceId) });
      if (!inv) return [];

      const existing = await db.query.reminder.findMany({
        where: eq(reminder.invoiceId, invoiceId),
        orderBy: [asc(reminder.scheduledFor)],
      });
      if (existing.length > 0) {
        return existing.map((r) => ({
          id: r.id,
          kind: r.kind,
          scheduledFor: r.scheduledFor.toISOString(),
          state: r.state,
        }));
      }

      const profile = await db.query.businessProfile.findFirst({
        where: eq(businessProfile.userId, inv.userId),
      });
      const offsets = profile?.reminderOffsetDays ?? [-3, 0, 3];
      const built = buildReminderSchedule(new Date(inv.dueDate), offsets, inv.sentAt ?? new Date());
      if (built.length === 0) return [];

      const rows = built.map((b) => ({
        id: newId("reminder"),
        invoiceId,
        kind: b.kind,
        scheduledFor: b.scheduledFor,
        state: "pending" as const,
      }));
      await db.insert(reminder).values(rows);
      return rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        scheduledFor: r.scheduledFor.toISOString(),
        state: "pending" as const,
      }));
    });

    for (const slot of slots) {
      if (slot.state !== "pending") continue;

      await step.sleepUntil(`wait-${slot.id}`, new Date(slot.scheduledFor));
      await step.run(`send-${slot.id}`, () => runReminderSlot(slot.id));
    }

    return { invoiceId, slots: slots.length };
  },
);
