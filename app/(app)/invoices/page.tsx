import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/chip";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { MoneyText } from "@/components/ui/money-text";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { TableKeyboardNav } from "@/components/ui/table-keyboard-nav";
import { requireUser } from "@/lib/auth/server";
import { formatDate } from "@/lib/format";
import { listInvoices } from "@/lib/invoices/queries";
import { displayStatus } from "@/lib/invoices/state";
import { formatMoney } from "@/lib/money";

export default async function InvoicesPage() {
  const user = await requireUser();
  const invoices = await listInvoices(user.id);
  const now = new Date();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Everything you've billed, and where it stands."
        action={
          <Link href="/invoices/new">
            <Button>New invoice</Button>
          </Link>
        }
      />

      {invoices.length === 0 ? (
        <EmptyState
          line="No invoices yet."
          hint="Build your first one and send it in a couple of minutes."
          action={
            <Link href="/invoices/new">
              <Button>Bill your first client</Button>
            </Link>
          }
        />
      ) : (
        <TableKeyboardNav>
          <div className="rounded-3xl border border-line bg-card">
            <Table>
              <THead>
                <TR>
                  <TH>Invoice</TH>
                  <TH>Client</TH>
                  <TH>Status</TH>
                  <TH>Due</TH>
                  <TH className="text-right">Total</TH>
                  <TH className="text-right">Link</TH>
                </TR>
              </THead>
              <TBody>
                {invoices.map((inv) => (
                  <TR key={inv.id}>
                    <TD>
                      <Link
                        href={`/invoices/${inv.id}`}
                        data-row-link
                        className="rounded font-geist font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                      >
                        {inv.number}
                      </Link>
                    </TD>
                    <TD>{inv.clientName}</TD>
                    <TD>
                      <StatusChip status={displayStatus(inv.status, new Date(inv.dueDate), now)} />
                    </TD>
                    <TD className="text-muted">{formatDate(inv.dueDate)}</TD>
                    <TD className="text-right">
                      <MoneyText>{formatMoney(inv.total, inv.currency)}</MoneyText>
                    </TD>
                    <TD className="text-right">
                      <CopyButton
                        value={`${appUrl}/i/${inv.publicToken}`}
                        label="Copy"
                        className="justify-end"
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </TableKeyboardNav>
      )}
    </div>
  );
}
