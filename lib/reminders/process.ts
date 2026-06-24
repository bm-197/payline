import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { businessProfile, client, invoice, invoiceActivity, reminder } from "@/lib/db/schema";
import { getMailer } from "@/lib/email";
import { buildReminderEmail } from "@/lib/email/messages";
import type { ReminderKind } from "./schedule";

export type ReminderOutcome = "sent" | "skipped" | "noop";

/**
 * Process one reminder slot. Used by the durable Inngest step after it sleeps to
 * the slot's time, and directly testable.
 *
 * Exactly-once: we CLAIM the row (pending -> sent) before sending the email, so a
 * retry finds it already non-pending and no-ops. This favors "never sent twice"
 * (the load-bearing rule) over at-least-once delivery. Paid/void invoices skip.
 */
export async function runReminderSlot(reminderId: string): Promise<ReminderOutcome> {
  const rem = await db.query.reminder.findFirst({ where: eq(reminder.id, reminderId) });
  if (rem?.state !== "pending") return "noop";

  const inv = await db.query.invoice.findFirst({ where: eq(invoice.id, rem.invoiceId) });
  if (!inv) return "noop";

  if (inv.status === "paid" || inv.status === "void") {
    const skipped = await db
      .update(reminder)
      .set({ state: "skipped" })
      .where(and(eq(reminder.id, reminderId), eq(reminder.state, "pending")))
      .returning({ id: reminder.id });
    return skipped.length > 0 ? "skipped" : "noop";
  }

  // Claim first: only one caller can flip pending -> sent.
  const claimed = await db
    .update(reminder)
    .set({ state: "sent", sentAt: new Date() })
    .where(and(eq(reminder.id, reminderId), eq(reminder.state, "pending")))
    .returning({ id: reminder.id });
  if (claimed.length === 0) return "noop";

  const [cust, profile] = await Promise.all([
    db.query.client.findFirst({ where: eq(client.id, inv.clientId) }),
    db.query.businessProfile.findFirst({
      where: eq(businessProfile.organizationId, inv.organizationId),
    }),
  ]);

  if (cust?.email) {
    await getMailer().send(
      buildReminderEmail({
        kind: rem.kind as ReminderKind,
        businessName: profile?.businessName ?? "Payline",
        clientName: cust.name,
        to: cust.email,
        invoiceNumber: inv.number,
        total: inv.total,
        currency: inv.currency,
        dueDate: inv.dueDate,
        publicToken: inv.publicToken,
      }),
    );
  }

  await db.insert(invoiceActivity).values({
    id: newId("activity"),
    invoiceId: inv.id,
    kind: "reminder_sent",
    actor: "system",
    meta: { kind: rem.kind },
  });

  return "sent";
}
