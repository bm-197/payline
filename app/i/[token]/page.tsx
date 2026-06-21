import { notFound } from "next/navigation";
import { InvoiceView } from "@/components/invoices/invoice-view";
import { PayButton } from "@/components/invoices/pay-button";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { loadPublicInvoice } from "@/lib/invoices/public";
import { displayStatus } from "@/lib/invoices/state";
import { paidTintClass, parseTheme } from "@/lib/invoices/theme";
import { formatMoney } from "@/lib/money";

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

  const { invoice: inv, business } = data;
  const theme = parseTheme(inv.theme ?? business?.theme);
  const now = new Date();
  const status = displayStatus(inv.status, new Date(inv.dueDate), now);
  const canPay = business?.stripeChargesEnabled ?? false;

  const paymentSlot =
    inv.status === "paid" ? (
      <div className={cn(paidTintClass(theme.paid.tint), "rounded-2xl px-5 py-4 text-center")}>
        <p className="font-serif text-lg italic">{theme.paid.title}</p>
        <p className="mt-1 text-sm text-muted">
          {inv.paidAt ? `Settled ${formatDate(inv.paidAt)}. ${theme.paid.note}` : theme.paid.note}
        </p>
      </div>
    ) : inv.status === "void" ? (
      <div className="rounded-2xl border border-line px-5 py-4 text-center text-sm text-faint">
        This invoice was voided and no longer needs payment.
      </div>
    ) : !canPay ? (
      <div className="rounded-2xl border border-line px-5 py-4 text-center text-sm text-muted">
        Online card payment isn't set up for this invoice yet. Reach out to
        {business?.businessName ? ` ${business.businessName}` : " the sender"} to arrange payment.
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
        <PayButton
          token={token}
          amountLabel={formatMoney(inv.total, inv.currency)}
          brandColor={theme.accentColor}
        />
      </div>
    );

  return (
    <div className="relative min-h-dvh overflow-hidden px-4 py-10 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-peri-deep/40 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-blush-deep/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-sage-deep/25 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <InvoiceView
          data={data}
          theme={theme}
          status={status}
          appUrl={process.env.APP_URL ?? "http://localhost:3000"}
          paymentSlot={paymentSlot}
          footerSlot={
            <a href={`/i/${token}/pdf`} className="underline-offset-4 hover:underline">
              Download PDF
            </a>
          }
        />
      </div>
    </div>
  );
}
