import "dotenv/config";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ send: vi.fn(async () => ({ id: "log_rem" })) }));
vi.mock("@/lib/email", () => ({ getMailer: () => ({ name: "test", send: h.send }) }));

import { db } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { businessProfile, client, invoice, invoiceActivity, reminder, user } from "@/lib/db/schema";
import { runReminderSlot } from "@/lib/reminders/process";

const userId = "usr_itest_rem000";
let openInvoiceId = "";
let paidInvoiceId = "";
let openReminderId = "";
let paidReminderId = "";

async function makeInvoice(status: "sent" | "paid", clientId: string) {
  const id = newId("invoice");
  await db.insert(invoice).values({
    id,
    userId,
    clientId,
    number: `INV-${status === "paid" ? "RP" : "RO"}1`,
    currency: "USD",
    status,
    issueDate: "2026-06-01",
    dueDate: "2026-06-10",
    subtotal: 5000,
    total: 5000,
  });
  return id;
}
async function makeReminder(invoiceId: string) {
  const id = newId("reminder");
  await db.insert(reminder).values({
    id,
    invoiceId,
    kind: "on_due",
    scheduledFor: new Date("2026-06-10T09:00:00Z"),
    state: "pending",
  });
  return id;
}

describe("runReminderSlot (integration, hits dev DB)", () => {
  beforeAll(async () => {
    await db.delete(user).where(eq(user.id, userId));
    await db.insert(user).values({ id: userId, email: "rem@payline.test", name: "Rem" });
    await db
      .insert(businessProfile)
      .values({ id: newId("business"), userId, businessName: "Rem Co" });
    const clientId = newId("client");
    await db
      .insert(client)
      .values({ id: clientId, userId, name: "Dana", email: "dana@example.com" });

    openInvoiceId = await makeInvoice("sent", clientId);
    paidInvoiceId = await makeInvoice("paid", clientId);
    openReminderId = await makeReminder(openInvoiceId);
    paidReminderId = await makeReminder(paidInvoiceId);
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, userId));
    await db.$client.end();
  });

  it("sends once on an open invoice, then never again (exactly one per slot)", async () => {
    expect(await runReminderSlot(openReminderId)).toBe("sent");
    expect(h.send).toHaveBeenCalledTimes(1);

    const row = await db.query.reminder.findFirst({ where: eq(reminder.id, openReminderId) });
    expect(row?.state).toBe("sent");
    expect(row?.sentAt).not.toBeNull();

    // Replay: no second email, stays sent.
    expect(await runReminderSlot(openReminderId)).toBe("noop");
    expect(h.send).toHaveBeenCalledTimes(1);

    const acts = (
      await db.query.invoiceActivity.findMany({
        where: eq(invoiceActivity.invoiceId, openInvoiceId),
      })
    ).filter((a) => a.kind === "reminder_sent");
    expect(acts).toHaveLength(1);
  });

  it("skips and never emails once the invoice is paid", async () => {
    h.send.mockClear();
    expect(await runReminderSlot(paidReminderId)).toBe("skipped");
    expect(h.send).not.toHaveBeenCalled();

    const row = await db.query.reminder.findFirst({ where: eq(reminder.id, paidReminderId) });
    expect(row?.state).toBe("skipped");
  });
});
