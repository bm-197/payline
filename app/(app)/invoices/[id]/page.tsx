import { notFound } from "next/navigation";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { StatusChip } from "@/components/ui/chip";
import { CopyButton } from "@/components/ui/copy-button";
import { MoneyText } from "@/components/ui/money-text";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireWorkspace } from "@/lib/auth/server";
import { formatDate, formatDateTime } from "@/lib/format";
import { getInvoiceDetail } from "@/lib/invoices/queries";
import { displayStatus } from "@/lib/invoices/state";
import { formatMoney, formatQuantity } from "@/lib/money";

const activityLabels: Record<string, string> = {
  created: "Created",
  sent: "Sent to client",
  viewed: "Opened by client",
  paid: "Paid",
  reminder_sent: "Reminder sent",
  voided: "Voided",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId, can } = await requireWorkspace();
  const detail = await getInvoiceDetail(orgId, id);
  if (!detail) notFound();

  const { invoice: inv, lines, activity, client } = detail;
  const now = new Date();
  const status = displayStatus(inv.status, new Date(inv.dueDate), now);
  const publicUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/i/${inv.publicToken}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-geist text-2xl font-semibold tracking-tight">{inv.number}</h1>
            <StatusChip status={status} />
          </div>
          <CopyButton value={inv.number} label="Copy number" />
        </div>

        <div className="rounded-3xl border border-line bg-card p-6">
          <div className="mb-6 flex justify-between text-sm">
            <div>
              <p className="text-faint">Billed to</p>
              <p className="mt-1 font-medium">{client?.name ?? "Unknown client"}</p>
              {client?.company ? <p className="text-muted">{client.company}</p> : null}
              {client?.email ? <p className="text-muted">{client.email}</p> : null}
            </div>
            <div className="text-right">
              <p className="text-faint">Issued</p>
              <p className="mt-1">{formatDate(inv.issueDate)}</p>
              <p className="mt-2 text-faint">Due</p>
              <p>{formatDate(inv.dueDate)}</p>
            </div>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Description</TH>
                <TH className="text-right">Qty</TH>
                <TH className="text-right">Unit</TH>
                <TH className="text-right">Amount</TH>
              </TR>
            </THead>
            <TBody>
              {lines.map((l) => (
                <TR key={l.id}>
                  <TD>{l.description}</TD>
                  <TD className="text-right font-geist tabular-nums">
                    {formatQuantity(l.quantity)}
                  </TD>
                  <TD className="text-right">
                    <MoneyText>{formatMoney(l.unitAmount, inv.currency)}</MoneyText>
                  </TD>
                  <TD className="text-right">
                    <MoneyText>{formatMoney(l.amount, inv.currency)}</MoneyText>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>

          <dl className="ml-auto mt-6 max-w-xs space-y-2 text-sm">
            <TotalRow label="Subtotal">
              <MoneyText>{formatMoney(inv.subtotal, inv.currency)}</MoneyText>
            </TotalRow>
            {inv.discount > 0 ? (
              <TotalRow label="Discount">
                <MoneyText>-{formatMoney(inv.discount, inv.currency)}</MoneyText>
              </TotalRow>
            ) : null}
            {inv.taxTotal > 0 ? (
              <TotalRow label="Tax">
                <MoneyText>{formatMoney(inv.taxTotal, inv.currency)}</MoneyText>
              </TotalRow>
            ) : null}
            <div className="border-t border-line pt-2">
              <TotalRow label="Total">
                <span className="font-semibold">
                  <MoneyText>{formatMoney(inv.total, inv.currency)}</MoneyText>
                </span>
              </TotalRow>
            </div>
          </dl>

          {inv.notes ? (
            <div className="mt-6 border-t border-line pt-4 text-sm text-muted">
              <p className="text-faint">Notes</p>
              <p className="mt-1 whitespace-pre-wrap">{inv.notes}</p>
            </div>
          ) : null}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-faint">Actions</p>
          <InvoiceActions
            id={inv.id}
            status={inv.status}
            token={inv.publicToken}
            can={{
              send: can("invoice", "send"),
              markPaid: can("invoice", "markPaid"),
              void: can("invoice", "void"),
            }}
          />
        </div>

        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Public link</p>
          <p className="mt-2 break-all font-geist text-xs text-muted">{publicUrl}</p>
          <div className="mt-3">
            <CopyButton value={publicUrl} label="Copy link" />
          </div>
          <p className="mt-3 text-xs text-faint">
            This is what your client sees. Card payment arrives next.
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Activity</p>
          <ol className="mt-3 space-y-3">
            {activity.map((a) => (
              <li key={a.id} className="text-sm">
                <p className="text-ink">{activityLabels[a.kind] ?? a.kind}</p>
                <p className="font-geist text-xs text-faint">{formatDateTime(a.at)}</p>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}

function TotalRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
