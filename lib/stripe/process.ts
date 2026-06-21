import "server-only";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { invoice, invoiceActivity, payment, stripeEvent } from "@/lib/db/schema";
import { emitInvoicePaid } from "@/lib/inngest/events";

/**
 * Record a Stripe event before acting on it. Returns true only the FIRST time an
 * event id is seen; a replayed webhook returns false and the caller does nothing.
 * This is the core idempotency guard (the StripeEvent table is the ledger).
 */
export async function recordStripeEvent(eventId: string, type: string): Promise<boolean> {
  const inserted = await db
    .insert(stripeEvent)
    .values({ id: newId("stripeEvent"), eventId, type })
    .onConflictDoNothing({ target: stripeEvent.eventId })
    .returning({ id: stripeEvent.id });
  return inserted.length > 0;
}

type CheckoutCompleted = {
  invoiceId: string;
  sessionId: string;
  paymentIntentId: string | null;
  amount: number;
  currency: string;
};

/**
 * Apply a completed checkout: create the Payment (once, keyed by session id),
 * transition the invoice to paid (once), log it, and cancel pending reminders.
 * Safe to call more than once for the same session.
 */
export async function applyCheckoutCompleted(input: CheckoutCompleted): Promise<void> {
  const inv = await db.query.invoice.findFirst({ where: eq(invoice.id, input.invoiceId) });
  if (!inv) return;

  await db
    .insert(payment)
    .values({
      id: newId("payment"),
      invoiceId: input.invoiceId,
      stripeCheckoutSessionId: input.sessionId,
      stripePaymentIntentId: input.paymentIntentId,
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      status: "succeeded",
      paidAt: new Date(),
    })
    .onConflictDoNothing({ target: payment.stripeCheckoutSessionId });

  if (inv.status !== "paid" && inv.status !== "void") {
    await db
      .update(invoice)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(invoice.id, input.invoiceId));
    await db.insert(invoiceActivity).values({
      id: newId("activity"),
      invoiceId: input.invoiceId,
      kind: "paid",
      actor: "system",
      meta: { via: "stripe", sessionId: input.sessionId },
    });
    await emitInvoicePaid(input.invoiceId);
  }
}

/** Top-level webhook dispatch. Idempotent via recordStripeEvent. */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  const firstSeen = await recordStripeEvent(event.id, event.type);
  if (!firstSeen) return;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoiceId;
    if (!invoiceId) return;
    await applyCheckoutCompleted({
      invoiceId,
      sessionId: session.id,
      paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
    });
  }
  // Connect readiness (v2 recipient capability) is refreshed on the Settings page
  // load via refreshAccountStatus, not from a v1 account.updated webhook.
}
