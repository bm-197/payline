import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { businessProfile, client, invoice, invoiceActivity, lineItem } from "@/lib/db/schema";

/**
 * Load a hosted invoice by its public token, recording a "viewed" the first time
 * a sent invoice is opened. Returns null when the token is unknown.
 */
export async function loadPublicInvoice(token: string) {
  const inv = await db.query.invoice.findFirst({
    where: eq(invoice.publicToken, token),
  });
  if (!inv) return null;

  if (inv.status === "sent") {
    const now = new Date();
    try {
      await db.transaction(async (tx) => {
        // Only the first open transitions sent -> viewed.
        const updated = await tx
          .update(invoice)
          .set({ status: "viewed", viewedAt: now })
          .where(eq(invoice.id, inv.id))
          .returning({ id: invoice.id });
        if (updated.length > 0) {
          await tx.insert(invoiceActivity).values({
            id: newId("activity"),
            invoiceId: inv.id,
            kind: "viewed",
            actor: "client",
          });
        }
      });
      inv.status = "viewed";
      inv.viewedAt = now;
    } catch {
      // View tracking is best-effort; never block the page on it.
    }
  }

  return assemble(inv);
}

/** Read-only fetch by token (used by the PDF route; never records a view). */
export async function getInvoiceForPdf(token: string) {
  const inv = await db.query.invoice.findFirst({
    where: eq(invoice.publicToken, token),
  });
  if (!inv) return null;
  return assemble(inv);
}

async function assemble(inv: typeof invoice.$inferSelect) {
  const [lines, cust, business] = await Promise.all([
    db.query.lineItem.findMany({
      where: eq(lineItem.invoiceId, inv.id),
      orderBy: [asc(lineItem.position)],
    }),
    db.query.client.findFirst({ where: eq(client.id, inv.clientId) }),
    db.query.businessProfile.findFirst({
      where: inv.organizationId
        ? eq(businessProfile.organizationId, inv.organizationId)
        : eq(businessProfile.userId, inv.userId),
    }),
  ]);

  return { invoice: inv, lines, client: cust ?? null, business: business ?? null };
}
