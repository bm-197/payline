import { eq } from "drizzle-orm";
import Link from "next/link";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/server";
import { listClients } from "@/lib/clients/queries";
import { db } from "@/lib/db";
import { businessProfile } from "@/lib/db/schema";
import { formatTaxRate } from "@/lib/money";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function NewInvoicePage() {
  const user = await requireUser();
  const [clients, profile] = await Promise.all([
    listClients(user.id),
    db.query.businessProfile.findFirst({ where: eq(businessProfile.userId, user.id) }),
  ]);

  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + (profile?.paymentTermsDays ?? 14));

  return (
    <div>
      <PageHeader title="New invoice" subtitle="Add line items and watch the total update live." />
      {clients.length === 0 ? (
        <div className="rounded-3xl border border-line bg-card p-6">
          <p className="text-sm text-muted">You need a client before you can bill one.</p>
          <Link href="/clients/new" className="mt-3 inline-block">
            <Button>Add a client</Button>
          </Link>
        </div>
      ) : (
        <InvoiceBuilder
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          defaults={{
            currency: profile?.defaultCurrency ?? "USD",
            taxRate: formatTaxRate(profile?.defaultTaxRateBps ?? 0).replace("%", ""),
            issueDate: ymd(today),
            dueDate: ymd(due),
          }}
        />
      )}
    </div>
  );
}
