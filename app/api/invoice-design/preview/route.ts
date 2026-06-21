import { renderToBuffer } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import { createElement } from "react";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import type { BusinessProfile, Client, Invoice, LineItem } from "@/lib/db/schema";
import { businessProfile } from "@/lib/db/schema";
import { sampleInvoice } from "@/lib/invoices/sample";
import { themeSchema } from "@/lib/invoices/theme";
import { InvoiceDocument } from "@/lib/pdf/invoice-pdf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  const parsed = themeSchema.safeParse(body?.theme);
  if (!parsed.success) return new Response("Invalid theme", { status: 400 });

  const profile = await db.query.businessProfile.findFirst({
    where: eq(businessProfile.userId, user.id),
  });
  const s = sampleInvoice(profile?.businessName ?? "Your business", profile?.address ?? null);

  // The sample is shaped for the DOM view; cast to the PDF's DB-row types (the
  // document only reads the fields present here), injecting the in-progress theme.
  const data = {
    invoice: { ...s.invoice, status: "sent" } as unknown as Invoice,
    lines: s.lines as unknown as LineItem[],
    client: s.client as unknown as Client,
    business: {
      businessName: s.business?.businessName ?? "",
      address: s.business?.address ?? null,
      theme: parsed.data,
    } as unknown as BusinessProfile,
  };

  const element = createElement(InvoiceDocument, data) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="sample.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
