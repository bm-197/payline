import { notFound } from "next/navigation";
import { PayButton } from "@/components/invoices/pay-button";
import { StatusChip } from "@/components/ui/chip";
import { Logo } from "@/components/ui/logo";
import { MoneyText } from "@/components/ui/money-text";
import { formatDate } from "@/lib/format";
import { loadPublicInvoice } from "@/lib/invoices/public";
import { displayStatus } from "@/lib/invoices/state";
import { formatMoney, formatQuantity } from "@/lib/money";

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string; canceled?: string }>;
}) {
  const { token } = await params;
  const { paid, canceled } = await searchParams;
  const data = await loadPublicInvoice(token);
  if (!data) notFound();

  const { invoice: inv, lines, client, business } = data;
  const now = new Date();
  const status = displayStatus(inv.status, new Date(inv.dueDate), now);
  const isPaid = inv.status === "paid";
  const isVoid = inv.status === "void";

  return (
    <div className="relative min-h-dvh overflow-hidden px-4 py-10 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-peri-deep/40 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-blush-deep/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-sage-deep/25 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <div className="glass overflow-hidden rounded-3xl">
          {/* Branded header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/40 p-7">
            <div>
              {business?.logoUrl ? (
                // biome-ignore lint/performance/noImgElement: arbitrary user URL, not a bundled asset
                <img
                  src={business.logoUrl}
                  alt={business.businessName}
                  className="mb-2 h-10 w-auto object-contain"
                />
              ) : null}
              <p className="text-lg font-semibold tracking-tight">
                {business?.businessName ?? "Invoice"}
              </p>
              {business?.address ? (
                <p className="mt-1 whitespace-pre-line text-xs text-muted">{business.address}</p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="font-geist text-sm font-medium">{inv.number}</p>
              <div className="mt-1.5 flex justify-end">
                <StatusChip status={status} />
              </div>
            </div>
          </div>

          <div className="p-7">
            <div className="flex flex-wrap justify-between gap-6 text-sm">
              <div>
                <p className="text-faint">Billed to</p>
                <p className="mt-1 font-medium">{client?.name ?? "Client"}</p>
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

            {/* Line items */}
            <div className="mt-7 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left font-geist text-xs uppercase tracking-wide text-faint">
                    <th className="py-2 pr-4 font-medium">Description</th>
                    <th className="py-2 px-2 text-right font-medium">Qty</th>
                    <th className="py-2 px-2 text-right font-medium">Unit</th>
                    <th className="py-2 pl-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b border-line/70 last:border-0">
                      <td className="py-3 pr-4">{l.description}</td>
                      <td className="py-3 px-2 text-right font-geist tabular-nums">
                        {formatQuantity(l.quantity)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <MoneyText>{formatMoney(l.unitAmount, inv.currency)}</MoneyText>
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <MoneyText>{formatMoney(l.amount, inv.currency)}</MoneyText>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <dl className="ml-auto mt-6 max-w-xs space-y-2 text-sm">
              <Row label="Subtotal">
                <MoneyText>{formatMoney(inv.subtotal, inv.currency)}</MoneyText>
              </Row>
              {inv.discount > 0 ? (
                <Row label="Discount">
                  <MoneyText>-{formatMoney(inv.discount, inv.currency)}</MoneyText>
                </Row>
              ) : null}
              {inv.taxTotal > 0 ? (
                <Row label="Tax">
                  <MoneyText>{formatMoney(inv.taxTotal, inv.currency)}</MoneyText>
                </Row>
              ) : null}
              <div className="border-t border-line pt-2">
                <Row label="Total due">
                  <span className="text-base font-semibold">
                    <MoneyText>{formatMoney(inv.total, inv.currency)}</MoneyText>
                  </span>
                </Row>
              </div>
            </dl>

            {inv.notes ? (
              <p className="mt-6 whitespace-pre-wrap border-t border-line pt-4 text-sm text-muted">
                {inv.notes}
              </p>
            ) : null}

            {/* Pay / paid / void state */}
            <div className="mt-8">
              {isPaid ? (
                <div className="glass-sage rounded-2xl px-5 py-4 text-center">
                  <p className="font-serif text-lg italic">Paid in full.</p>
                  <p className="mt-1 text-sm text-muted">
                    {inv.paidAt ? `Settled ${formatDate(inv.paidAt)}. Thank you.` : "Thank you."}
                  </p>
                </div>
              ) : isVoid ? (
                <div className="rounded-2xl border border-line px-5 py-4 text-center text-sm text-faint">
                  This invoice was voided and no longer needs payment.
                </div>
              ) : !business?.stripeChargesEnabled ? (
                <div className="rounded-2xl border border-line px-5 py-4 text-center text-sm text-muted">
                  Online card payment isn't set up for this invoice yet. Reach out to
                  {business?.businessName ? ` ${business.businessName}` : " the sender"} to arrange
                  payment.
                </div>
              ) : (
                <div>
                  {paid ? (
                    <p className="mb-3 rounded-xl bg-sage/60 px-4 py-2 text-center text-sm text-ink">
                      Payment received. This page updates the moment it settles.
                    </p>
                  ) : canceled ? (
                    <p className="mb-3 text-center text-sm text-muted">
                      Checkout canceled. You can try again whenever you're ready.
                    </p>
                  ) : null}
                  <PayButton token={token} amountLabel={formatMoney(inv.total, inv.currency)} />
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-faint">
              <a href={`/i/${token}/pdf`} className="underline-offset-4 hover:underline">
                Download PDF
              </a>
              <span className="inline-flex items-center gap-1.5">
                <Logo size={14} /> Powered by Payline
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
