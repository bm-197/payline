import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import type Stripe from "stripe";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/inngest/events", () => ({
  emitInvoicePaid: vi.fn(async () => {}),
  emitInvoiceSent: vi.fn(async () => {}),
  emitInvoiceVoided: vi.fn(async () => {}),
}));

import { db } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import {
  businessProfile,
  client,
  invoice,
  invoiceActivity,
  payment,
  stripeEvent,
  user,
} from "@/lib/db/schema";
import { handleStripeEvent } from "@/lib/stripe/process";

const userId = "usr_itest_hook00";
const invoiceId = newId("invoice");
const sessionId = "cs_test_hook_1";
const eventId = "evt_test_hook_1";

function completedEvent(id: string): Stripe.Event {
  return {
    id,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        metadata: { invoiceId },
        payment_intent: "pi_test_hook_1",
        amount_total: 322585,
        currency: "usd",
      },
    },
  } as unknown as Stripe.Event;
}

describe("Stripe webhook idempotency (integration, hits dev DB)", () => {
  beforeAll(async () => {
    await db.delete(user).where(eq(user.id, userId));
    await db.delete(stripeEvent).where(inArray(stripeEvent.eventId, [eventId, "evt_test_hook_2"]));
    await db.insert(user).values({ id: userId, email: "hook@payline.test", name: "Hook" });
    await db
      .insert(businessProfile)
      .values({ id: newId("business"), userId, businessName: "Hook Co" });
    const clientId = newId("client");
    await db.insert(client).values({ id: clientId, userId, name: "Payer" });
    await db.insert(invoice).values({
      id: invoiceId,
      userId,
      clientId,
      number: "INV-HOOK1",
      currency: "USD",
      status: "sent",
      issueDate: "2026-06-01",
      dueDate: "2026-06-20",
      subtotal: 298000,
      taxTotal: 24585,
      taxRateBps: 825,
      total: 322585,
    });
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, userId));
    await db.delete(stripeEvent).where(inArray(stripeEvent.eventId, [eventId, "evt_test_hook_2"]));
    await db.$client.end();
  });

  it("marks the invoice paid and records exactly one payment", async () => {
    await handleStripeEvent(completedEvent(eventId));

    const inv = await db.query.invoice.findFirst({ where: eq(invoice.id, invoiceId) });
    expect(inv?.status).toBe("paid");
    expect(inv?.paidAt).not.toBeNull();

    const payments = await db.query.payment.findMany({ where: eq(payment.invoiceId, invoiceId) });
    expect(payments).toHaveLength(1);
    expect(payments[0]?.amount).toBe(322585);
    expect(payments[0]?.stripeCheckoutSessionId).toBe(sessionId);
  });

  it("ignores a replay of the SAME event id (no second payment, no re-transition)", async () => {
    await handleStripeEvent(completedEvent(eventId));

    const payments = await db.query.payment.findMany({ where: eq(payment.invoiceId, invoiceId) });
    expect(payments).toHaveLength(1);

    const paidActs = (
      await db.query.invoiceActivity.findMany({ where: eq(invoiceActivity.invoiceId, invoiceId) })
    ).filter((a) => a.kind === "paid");
    expect(paidActs).toHaveLength(1);
  });

  it("ignores a NEW event id for the same session (payment unique on session)", async () => {
    await handleStripeEvent(completedEvent("evt_test_hook_2"));

    const payments = await db.query.payment.findMany({ where: eq(payment.invoiceId, invoiceId) });
    expect(payments).toHaveLength(1);
  });
});
