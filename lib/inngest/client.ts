import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "payline" });

// Event payload shapes (Inngest 4.x types events at the trigger boundary).
export type InvoiceSentData = { invoiceId: string; userId: string };
export type InvoiceRefData = { invoiceId: string };
