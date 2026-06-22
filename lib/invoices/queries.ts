import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { client, invoice, invoiceActivity, lineItem } from "@/lib/db/schema";

export function listInvoices(orgId: string) {
  return db
    .select({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      currency: invoice.currency,
      total: invoice.total,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      publicToken: invoice.publicToken,
      clientName: client.name,
    })
    .from(invoice)
    .innerJoin(client, eq(client.id, invoice.clientId))
    .where(eq(invoice.organizationId, orgId))
    .orderBy(desc(invoice.createdAt));
}

export async function getInvoiceDetail(orgId: string, id: string) {
  const inv = await db.query.invoice.findFirst({
    where: and(eq(invoice.id, id), eq(invoice.organizationId, orgId)),
  });
  if (!inv) return null;

  const [lines, activity, cust] = await Promise.all([
    db.query.lineItem.findMany({
      where: eq(lineItem.invoiceId, id),
      orderBy: [asc(lineItem.position)],
    }),
    db.query.invoiceActivity.findMany({
      where: eq(invoiceActivity.invoiceId, id),
      orderBy: [desc(invoiceActivity.at)],
    }),
    db.query.client.findFirst({ where: eq(client.id, inv.clientId) }),
  ]);

  return { invoice: inv, lines, activity, client: cust ?? null };
}
