import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { MoneyText } from "@/components/ui/money-text";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireWorkspace } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { businessProfile } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import { listInvoices } from "@/lib/invoices/queries";
import { displayStatus } from "@/lib/invoices/state";
import { formatMoney } from "@/lib/money";

export default async function DashboardPage() {
  const { user, orgId } = await requireWorkspace();
  const [profile, invoices] = await Promise.all([
    db.query.businessProfile.findFirst({ where: eq(businessProfile.organizationId, orgId) }),
    listInvoices(orgId),
  ]);

  const now = new Date();
  const currency = profile?.defaultCurrency ?? "USD";
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Money is summed only in the home currency (mixing currencies would be wrong).
  const inHome = invoices.filter((i) => i.currency === currency);
  const outstanding = inHome
    .filter((i) => i.status === "sent" || i.status === "viewed")
    .reduce((sum, i) => sum + i.total, 0);
  const paidThisMonth = inHome
    .filter((i) => i.status === "paid" && i.paidAt && i.paidAt >= monthStart)
    .reduce((sum, i) => sum + i.total, 0);
  const overdueCount = invoices.filter(
    (i) => displayStatus(i.status, new Date(i.dueDate), now) === "overdue",
  ).length;
  const recent = invoices.slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user.name || "there"}.`}
        action={
          <Link href="/invoices/new">
            <Button>New invoice</Button>
          </Link>
        }
      />

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        <div className="rounded-3xl bg-butter p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          <p className="text-sm text-ink/70">Outstanding</p>
          <p className="mt-2 text-2xl font-semibold">
            <MoneyText>{formatMoney(outstanding, currency)}</MoneyText>
          </p>
        </div>
        <GlassCard tint="sage">
          <p className="text-sm text-muted">Paid this month</p>
          <p className="mt-2 text-2xl font-semibold">
            <MoneyText>{formatMoney(paidThisMonth, currency)}</MoneyText>
          </p>
        </GlassCard>
        <GlassCard tint="blush">
          <p className="text-sm text-muted">Overdue</p>
          <p className="mt-2 text-2xl font-semibold">{overdueCount}</p>
        </GlassCard>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          line="Nothing billed yet."
          hint="Your recent invoices will show up here."
          action={
            <Link href="/invoices/new">
              <Button>Bill your first client</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-3xl border border-line bg-card">
          <Table>
            <THead>
              <TR>
                <TH>Invoice</TH>
                <TH>Client</TH>
                <TH>Status</TH>
                <TH>Due</TH>
                <TH className="text-right">Total</TH>
              </TR>
            </THead>
            <TBody>
              {recent.map((inv) => (
                <TR key={inv.id}>
                  <TD>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-geist font-medium underline-offset-4 hover:underline"
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
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
