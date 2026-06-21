import { inngest } from "./client";

/**
 * Thin emitters the domain actions call. Sending invoice/sent starts the durable
 * reminder run; invoice/paid and invoice/voided cancel it (see functions/reminders).
 *
 * Emits are best-effort relative to the core mutation: if the Inngest dev server
 * is not running locally, we log and move on rather than failing the user action.
 * In production Inngest is always reachable.
 */

async function safeSend(name: string, data: Record<string, string>): Promise<void> {
  try {
    await inngest.send({ name, data });
  } catch (err) {
    console.warn(`[inngest] failed to emit ${name}:`, (err as Error).message);
  }
}

export function emitInvoiceSent(invoiceId: string, userId: string) {
  return safeSend("invoice/sent", { invoiceId, userId });
}

export function emitInvoicePaid(invoiceId: string) {
  return safeSend("invoice/paid", { invoiceId });
}

export function emitInvoiceVoided(invoiceId: string) {
  return safeSend("invoice/voided", { invoiceId });
}
