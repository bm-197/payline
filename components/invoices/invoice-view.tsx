import type { CSSProperties, ReactNode } from "react";
import { StatusChip } from "@/components/ui/chip";
import { Logo } from "@/components/ui/logo";
import { MoneyText } from "@/components/ui/money-text";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { DisplayStatus } from "@/lib/invoices/state";
import { baseFontPx, densityScale, fontCss, type InvoiceTheme } from "@/lib/invoices/theme";
import { formatMoney, formatQuantity } from "@/lib/money";

export type InvoiceViewData = {
  invoice: {
    number: string;
    currency: string;
    issueDate: string;
    dueDate: string;
    notes: string | null;
    subtotal: number;
    discount: number;
    taxTotal: number;
    total: number;
  };
  lines: {
    id: string;
    description: string;
    quantity: number;
    unitAmount: number;
    amount: number;
  }[];
  client: { name: string; company: string | null; email: string | null } | null;
  business: { businessName: string; address: string | null } | null;
};

const logoHeight: Record<InvoiceTheme["logo"]["size"], number> = { s: 28, m: 40, l: 56 };

const STATUS_LABELS: Record<DisplayStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Opened",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

/**
 * The themed invoice document. Shared by the hosted page and the editor preview so
 * they can never drift; the PDF renders the same tokens separately (see docs/adr/0001).
 * "Powered by Payline" is always present. The interactive pay area is a slot.
 */
export function InvoiceView({
  data,
  theme,
  status,
  paymentSlot,
  footerSlot,
  appUrl = "/",
}: {
  data: InvoiceViewData;
  theme: InvoiceTheme;
  status: DisplayStatus;
  paymentSlot?: ReactNode;
  footerSlot?: ReactNode;
  appUrl?: string;
}) {
  const { invoice: inv, lines, client, business } = data;
  const pad = Math.round(28 * densityScale(theme.density));
  const rowGap = Math.round(12 * densityScale(theme.density));

  const rootStyle: CSSProperties = {
    fontFamily: fontCss(theme.font),
    fontSize: baseFontPx(theme.textScale),
  };

  const businessName = business?.businessName ?? "Invoice";
  const logoSize = logoHeight[theme.logo.size];
  const logo = theme.logo.url ? (
    theme.logo.shape === "square" ? (
      // biome-ignore lint/performance/noImgElement: arbitrary user URL, not a bundled asset
      <img
        src={theme.logo.url}
        alt={businessName}
        style={{ height: logoSize }}
        className="w-auto object-contain"
      />
    ) : (
      <span
        className={cn(
          "inline-block overflow-hidden",
          theme.logo.shape === "circle" ? "rounded-full" : "rounded-lg",
        )}
        style={{ width: logoSize, height: logoSize }}
      >
        {/* biome-ignore lint/performance/noImgElement: arbitrary user URL, not a bundled asset */}
        <img src={theme.logo.url} alt={businessName} className="size-full object-cover" />
      </span>
    )
  ) : null;

  const centered = theme.logo.placement === "center";

  const ts = theme.tableStyle;
  const bordered = ts === "bordered";
  const zebra = ts === "zebra";
  const headClass =
    ts === "minimal" ? "" : bordered ? "border-b-2 border-line" : "border-b border-line";
  const rowBorder = ts === "minimal" || zebra ? "" : "border-b border-line/70 last:border-0";
  const { showQty, showUnit } = theme.fields;
  const glassClass =
    theme.background === "blush"
      ? "glass-blush"
      : theme.background === "sage"
        ? "glass-sage"
        : theme.background === "peri"
          ? "glass-peri"
          : "glass";

  return (
    <div className={cn(glassClass, "overflow-hidden rounded-3xl")} style={rootStyle}>
      {theme.layout === "bold" ? (
        <div
          style={{ backgroundColor: theme.accentColor, padding: pad }}
          className={
            centered
              ? "flex flex-col items-center gap-4 text-center text-white"
              : "flex items-start justify-between gap-4 text-white"
          }
        >
          <div className={centered ? "flex flex-col items-center" : undefined}>
            {logo ? <div className="mb-2">{logo}</div> : null}
            <p className="font-semibold tracking-tight" style={{ fontSize: "1.2em" }}>
              {businessName}
            </p>
            {business?.address ? (
              <p className="mt-1 whitespace-pre-line text-white/75" style={{ fontSize: "0.78em" }}>
                {business.address}
              </p>
            ) : null}
          </div>
          <div className={centered ? "text-center" : "text-right"}>
            <p className="font-geist font-medium">{`Inv #${inv.number}`}</p>
            <p className="mt-1 text-white/80" style={{ fontSize: "0.8em" }}>
              {STATUS_LABELS[status]}
            </p>
          </div>
        </div>
      ) : null}

      <div style={{ padding: pad }}>
        {theme.layout !== "bold" ? <StandardHeader /> : null}

        <div className="flex flex-wrap justify-between gap-6" style={{ marginTop: pad }}>
          <div>
            <p className="text-faint" style={{ fontSize: "0.78em" }}>
              Billed to
            </p>
            <p className="mt-1 font-medium">{client?.name ?? "Client"}</p>
            {client?.company ? <p className="text-muted">{client.company}</p> : null}
            {client?.email ? <p className="text-muted">{client.email}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-faint" style={{ fontSize: "0.78em" }}>
              Issued
            </p>
            <p className="mt-1">{formatDate(inv.issueDate)}</p>
            {theme.fields.showDueDate ? (
              <>
                <p className="mt-2 text-faint" style={{ fontSize: "0.78em" }}>
                  Due
                </p>
                <p>{formatDate(inv.dueDate)}</p>
              </>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto" style={{ marginTop: pad }}>
          <table className={cn("w-full", bordered && "border border-line")}>
            <thead>
              <tr
                className={cn("text-left font-geist uppercase tracking-wide text-faint", headClass)}
                style={{ fontSize: "0.72em" }}
              >
                <th className={cn("py-2 pr-4 font-medium", bordered && "border border-line px-3")}>
                  Description
                </th>
                {showQty ? (
                  <th
                    className={cn(
                      "px-2 py-2 text-right font-medium",
                      bordered && "border border-line",
                    )}
                  >
                    Qty
                  </th>
                ) : null}
                {showUnit ? (
                  <th
                    className={cn(
                      "px-2 py-2 text-right font-medium",
                      bordered && "border border-line",
                    )}
                  >
                    Unit
                  </th>
                ) : null}
                <th
                  className={cn(
                    "py-2 pl-2 text-right font-medium",
                    bordered && "border border-line px-3",
                  )}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.id} className={cn(rowBorder, zebra && i % 2 === 1 && "bg-line/25")}>
                  <td
                    className={cn("pr-4", bordered && "border border-line px-3")}
                    style={{ paddingTop: rowGap, paddingBottom: rowGap }}
                  >
                    {l.description}
                  </td>
                  {showQty ? (
                    <td
                      className={cn(
                        "px-2 text-right font-geist tabular-nums",
                        bordered && "border border-line",
                      )}
                    >
                      {formatQuantity(l.quantity)}
                    </td>
                  ) : null}
                  {showUnit ? (
                    <td className={cn("px-2 text-right", bordered && "border border-line")}>
                      <MoneyText>{formatMoney(l.unitAmount, inv.currency)}</MoneyText>
                    </td>
                  ) : null}
                  <td className={cn("pl-2 text-right", bordered && "border border-line px-3")}>
                    <MoneyText>{formatMoney(l.amount, inv.currency)}</MoneyText>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto max-w-xs space-y-2" style={{ marginTop: pad }}>
          <Row label="Subtotal">
            <MoneyText>{formatMoney(inv.subtotal, inv.currency)}</MoneyText>
          </Row>
          {theme.fields.showTaxDiscount && inv.discount > 0 ? (
            <Row label="Discount">
              <MoneyText>-{formatMoney(inv.discount, inv.currency)}</MoneyText>
            </Row>
          ) : null}
          {theme.fields.showTaxDiscount && inv.taxTotal > 0 ? (
            <Row label="Tax">
              <MoneyText>{formatMoney(inv.taxTotal, inv.currency)}</MoneyText>
            </Row>
          ) : null}
          <div className="border-t border-line pt-2">
            <Row label="Total due">
              <span
                className="font-semibold"
                style={{ fontSize: "1.15em", color: theme.accentColor }}
              >
                <MoneyText>{formatMoney(inv.total, inv.currency)}</MoneyText>
              </span>
            </Row>
          </div>
        </dl>

        {theme.fields.showNotes && inv.notes ? (
          <p
            className="whitespace-pre-wrap border-t border-line text-muted"
            style={{ marginTop: pad, paddingTop: 16 }}
          >
            {inv.notes}
          </p>
        ) : null}

        {theme.payment ? (
          <div className="border-t border-line" style={{ marginTop: pad, paddingTop: 16 }}>
            <p className="text-faint" style={{ fontSize: "0.78em" }}>
              Payment details
            </p>
            <p className="mt-1 whitespace-pre-wrap text-muted">{theme.payment}</p>
          </div>
        ) : null}

        {paymentSlot ? <div style={{ marginTop: pad }}>{paymentSlot}</div> : null}

        {theme.footer ? (
          <p
            className="border-t border-line text-center text-muted"
            style={{ marginTop: pad, paddingTop: 16, fontSize: "0.85em" }}
          >
            {theme.footer}
          </p>
        ) : null}

        <div
          className="flex items-center justify-between text-faint"
          style={{ marginTop: pad, fontSize: "0.72em" }}
        >
          {footerSlot ?? <span />}
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
          >
            <Logo size={14} /> Powered by Payline
          </a>
        </div>
      </div>
    </div>
  );

  // Classic + Minimal share this header. Classic carries the brand color as a short
  // rule under the business name plus an accent-colored number; Minimal stays plain.
  function StandardHeader() {
    const minimal = theme.layout === "minimal";
    const classic = theme.layout === "classic";
    return (
      <div
        className={
          centered
            ? "flex flex-col items-center gap-3 text-center"
            : "flex items-start justify-between gap-4"
        }
      >
        <div className={centered ? "flex flex-col items-center" : undefined}>
          {logo ? <div className="mb-2">{logo}</div> : null}
          <p
            className={minimal ? "font-medium tracking-tight" : "font-semibold tracking-tight"}
            style={{ fontSize: minimal ? "1.05em" : "1.15em" }}
          >
            {businessName}
          </p>
          {classic ? (
            <div
              className="mt-2 h-[3px] w-9 rounded-full"
              style={{ backgroundColor: theme.accentColor }}
            />
          ) : null}
          {business?.address ? (
            <p className="mt-2 whitespace-pre-line text-muted" style={{ fontSize: "0.78em" }}>
              {business.address}
            </p>
          ) : null}
        </div>
        <div className={centered ? "text-center" : "text-right"}>
          <p
            className={minimal ? "font-geist text-faint" : "font-geist font-medium"}
            style={classic ? { color: theme.accentColor } : undefined}
          >
            {`Inv #${inv.number}`}
          </p>
          <div className={`mt-1.5 flex ${centered ? "justify-center" : "justify-end"}`}>
            <StatusChip status={status} />
          </div>
        </div>
      </div>
    );
  }
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
