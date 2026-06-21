import "dotenv/config";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Hoisted holders so the mock factories can see them.
const h = vi.hoisted(() => ({
  userId: "usr_itest_send00",
  mailerSend: vi.fn(async () => ({ id: "log_itest" })),
  emitSent: vi.fn(async () => {}),
}));

vi.mock("@/lib/auth/server", () => ({ requireUser: async () => ({ id: h.userId }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/email", () => ({ getMailer: () => ({ name: "test", send: h.mailerSend }) }));
vi.mock("@/lib/inngest/events", () => ({
  emitInvoiceSent: h.emitSent,
  emitInvoicePaid: vi.fn(async () => {}),
  emitInvoiceVoided: vi.fn(async () => {}),
}));

import { db } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { businessProfile, client, invoice, invoiceActivity, user } from "@/lib/db/schema";
import { sendInvoiceAction } from "@/lib/invoices/actions";

const invoiceId = newId("invoice");

describe("sendInvoiceAction (integration, hits dev DB)", () => {
  beforeAll(async () => {
    await db.delete(user).where(eq(user.id, h.userId));
    await db.insert(user).values({ id: h.userId, email: "itest@payline.test", name: "IT" });
    await db
      .insert(businessProfile)
      .values({ id: newId("business"), userId: h.userId, businessName: "IT Co" });
    const clientId = newId("client");
    await db
      .insert(client)
      .values({ id: clientId, userId: h.userId, name: "Casey", email: "casey@example.com" });
    await db.insert(invoice).values({
      id: invoiceId,
      userId: h.userId,
      clientId,
      number: "INV-IT01",
      currency: "USD",
      status: "draft",
      issueDate: "2026-06-01",
      dueDate: "2026-06-20",
      subtotal: 10000,
      total: 10000,
    });
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, h.userId));
    await db.$client.end();
  });

  it("transitions draft->sent, emails the client, logs activity, emits invoice/sent", async () => {
    const res = await sendInvoiceAction(invoiceId);
    expect(res.error).toBeUndefined();

    const updated = await db.query.invoice.findFirst({ where: eq(invoice.id, invoiceId) });
    expect(updated?.status).toBe("sent");
    expect(updated?.sentAt).not.toBeNull();

    expect(h.mailerSend).toHaveBeenCalledTimes(1);
    expect(h.emitSent).toHaveBeenCalledWith(invoiceId, h.userId);

    const acts = await db.query.invoiceActivity.findMany({
      where: eq(invoiceActivity.invoiceId, invoiceId),
    });
    expect(acts.some((a) => a.kind === "sent")).toBe(true);
  });

  it("refuses to send an already-sent invoice", async () => {
    const res = await sendInvoiceAction(invoiceId);
    expect(res.error).toMatch(/already been sent/);
  });
});
