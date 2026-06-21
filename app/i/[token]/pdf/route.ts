import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { getInvoiceForPdf } from "@/lib/invoices/public";
import { InvoiceDocument } from "@/lib/pdf/invoice-pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const data = await getInvoiceForPdf(token);
  if (!data) return new Response("Not found", { status: 404 });

  // @react-pdf types the arg by the Document's return, not the component's props.
  const element = createElement(InvoiceDocument, data) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.invoice.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
