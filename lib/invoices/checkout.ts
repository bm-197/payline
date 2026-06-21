"use server";

import { getInvoiceForPdf } from "@/lib/invoices/public";
import { getStripe } from "@/lib/stripe/client";
import { applicationFee } from "@/lib/stripe/fee";

export type CheckoutResult = { url?: string; error?: string };

/**
 * Create a Stripe Checkout Session for a hosted invoice (by public token, no auth).
 * Returns the session URL for the client to redirect to. The invoiceId travels in
 * metadata so the webhook can mark the right invoice paid.
 */
export async function createCheckoutSession(token: string): Promise<CheckoutResult> {
  const data = await getInvoiceForPdf(token);
  if (!data) return { error: "Invoice not found." };

  const inv = data.invoice;
  if (inv.status === "paid") return { error: "This invoice is already paid." };
  if (inv.status === "void" || inv.status === "draft") {
    return { error: "This invoice isn't open for payment." };
  }

  const destination = data.business?.stripeAccountId;
  if (!destination || !data.business?.stripeChargesEnabled) {
    return { error: "This business isn't set up to accept card payments yet." };
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: inv.id,
      metadata: { invoiceId: inv.id },
      payment_intent_data: {
        metadata: { invoiceId: inv.id },
        // Destination charge: funds go to the freelancer, Payline keeps the 1% fee.
        transfer_data: { destination },
        application_fee_amount: applicationFee(inv.total),
      },
      success_url: `${appUrl}/i/${token}?paid=1`,
      cancel_url: `${appUrl}/i/${token}?canceled=1`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: inv.currency.toLowerCase(),
            unit_amount: inv.total,
            product_data: {
              name: `Invoice ${inv.number}`,
              description: data.business?.businessName ?? undefined,
            },
          },
        },
      ],
    });
    return session.url ? { url: session.url } : { error: "Could not start checkout." };
  } catch (err) {
    console.error("[stripe] checkout create failed:", (err as Error).message);
    return { error: "Payment is temporarily unavailable. Please try again." };
  }
}
