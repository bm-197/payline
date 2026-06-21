import type { InvoiceViewData } from "@/components/invoices/invoice-view";

/** A canned, representative invoice for the design preview (page + PDF). */
export function sampleInvoice(businessName: string, address: string | null): InvoiceViewData {
  return {
    invoice: {
      number: "1001-20260613-001",
      currency: "USD",
      issueDate: "2026-06-13",
      dueDate: "2026-06-27",
      notes: "Thank you. Payment is due within 14 days.",
      subtotal: 157500,
      discount: 0,
      taxTotal: 0,
      total: 157500,
    },
    lines: [
      {
        id: "1",
        description: "Consulting, 8 hrs",
        quantity: 8000,
        unitAmount: 15000,
        amount: 120000,
      },
      {
        id: "2",
        description: "Two rounds of revisions",
        quantity: 1000,
        unitAmount: 37500,
        amount: 37500,
      },
    ],
    client: { name: "Atlas Studio", company: "Atlas Studio", email: "ap@atlas.example" },
    business: { businessName, address },
  };
}
