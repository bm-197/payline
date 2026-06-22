import "server-only";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { client, invoice } from "@/lib/db/schema";

export async function listClients(orgId: string) {
  return db
    .select({
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company,
      invoiceCount: count(invoice.id),
    })
    .from(client)
    .leftJoin(invoice, eq(invoice.clientId, client.id))
    .where(eq(client.organizationId, orgId))
    .groupBy(client.id)
    .orderBy(asc(client.name));
}

export function getClient(orgId: string, id: string) {
  return db.query.client.findFirst({
    where: and(eq(client.organizationId, orgId), eq(client.id, id)),
  });
}
