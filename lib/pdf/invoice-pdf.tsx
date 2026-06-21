import path from "node:path";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BusinessProfile, Client, Invoice, LineItem } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import {
  backgroundHex,
  baseFontPx,
  densityScale,
  type InvoiceTheme,
  parseTheme,
} from "@/lib/invoices/theme";
import { formatMoney, formatQuantity } from "@/lib/money";
import { pdfFontFamily, registerPdfFonts } from "./fonts";

registerPdfFonts();

const ink = "#19191d";
const muted = "#626275";
const faint = "#898b91";
const line = "#e7e9ef";

const PAYLINE_LOGO = path.join(process.cwd(), "public/logo.png");

// Styles scale with the theme's text size + density so the PDF tracks the page.
function makeStyles(theme: InvoiceTheme) {
  const f = baseFontPx(theme.textScale) / 14;
  const d = densityScale(theme.density);
  const fs = (px: number) => Math.round(px * f);
  const sp = (px: number) => Math.round(px * d);
  const ts = theme.tableStyle;
  const rowBorderW = ts === "lines" || ts === "bordered" ? 1 : 0;
  const headBorderW = ts === "minimal" ? 0 : 1;
  const cellPad = ts === "bordered" ? 4 : 0;
  const cellBorder =
    ts === "bordered" ? { borderRightWidth: 1, borderColor: line, paddingHorizontal: 4 } : {};
  return StyleSheet.create({
    page: { padding: sp(40), fontSize: fs(10), color: ink },
    headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: sp(28) },
    headerCenter: { alignItems: "center", marginBottom: sp(28) },
    business: { fontSize: fs(15), fontWeight: "bold" },
    address: { color: muted, fontSize: fs(8), marginTop: 4, lineHeight: 1.4 },
    number: { fontSize: fs(11), fontWeight: "bold", textAlign: "right" },
    status: { color: faint, fontSize: fs(9), textAlign: "right", marginTop: 3 },
    metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: sp(24) },
    label: { color: faint, fontSize: fs(8), marginBottom: 2 },
    strong: { fontWeight: "bold" },
    tableWrap: ts === "bordered" ? { borderWidth: 1, borderColor: line } : {},
    tableHead: {
      flexDirection: "row",
      borderBottomWidth: headBorderW,
      borderBottomColor: line,
      paddingBottom: 6,
      paddingHorizontal: cellPad,
      color: faint,
      fontSize: fs(8),
      textTransform: "uppercase",
    },
    row: {
      flexDirection: "row",
      borderBottomWidth: rowBorderW,
      borderBottomColor: line,
      paddingVertical: sp(7),
      paddingHorizontal: cellPad,
    },
    rowZebra: { backgroundColor: "#f3f4f7" },
    cDesc: { flex: 1, ...cellBorder },
    cQty: { width: 60, textAlign: "right", ...cellBorder },
    cUnit: { width: 80, textAlign: "right", ...cellBorder },
    cAmount: {
      width: 80,
      textAlign: "right",
      ...(ts === "bordered" ? { paddingHorizontal: 4 } : {}),
    },
    totals: { marginTop: sp(18), marginLeft: "auto", width: 200 },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    grand: { borderTopWidth: 1, borderTopColor: line, marginTop: 4, paddingTop: 6 },
    notes: {
      marginTop: sp(24),
      color: muted,
      borderTopWidth: 1,
      borderTopColor: line,
      paddingTop: 10,
    },
    payment: {
      marginTop: sp(24),
      borderTopWidth: 1,
      borderTopColor: line,
      paddingTop: 10,
    },
    paymentLabel: { color: faint, fontSize: fs(8), marginBottom: 3, textTransform: "uppercase" },
    paidBox: { marginTop: sp(24), borderRadius: 12, padding: sp(14), alignItems: "center" },
    paidTitle: { fontSize: fs(13), fontWeight: "bold" },
    paidNote: { fontSize: fs(9), color: muted, marginTop: 3 },
    brandRule: { width: 28, height: 2.5, borderRadius: 2, marginTop: 5 },
    footer: {
      marginTop: sp(32),
      borderTopWidth: 1,
      borderTopColor: line,
      paddingTop: 10,
      fontSize: fs(8),
      color: faint,
    },
    footerNote: { color: muted, marginBottom: 4 },
    poweredRow: { flexDirection: "row", alignItems: "center" },
    poweredLogo: { width: fs(11), height: fs(11), marginRight: 4 },
    businessMinimal: { fontSize: fs(13) },
    boldBanner: {
      marginTop: -sp(40),
      marginLeft: -sp(40),
      marginRight: -sp(40),
      marginBottom: sp(24),
      padding: sp(40),
      flexDirection: "row",
      justifyContent: "space-between",
    },
    boldName: { fontSize: fs(15), fontWeight: "bold", color: "#ffffff" },
    boldAddress: { color: "#ffffffbf", fontSize: fs(8), marginTop: 4, lineHeight: 1.4 },
    boldNumber: { fontSize: fs(11), fontWeight: "bold", color: "#ffffff", textAlign: "right" },
    boldStatus: { color: "#ffffffcc", fontSize: fs(9), textAlign: "right", marginTop: 3 },
  });
}

type Data = {
  invoice: Invoice;
  lines: LineItem[];
  client: Client | null;
  business: BusinessProfile | null;
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Opened",
  paid: "Paid",
  void: "Void",
};

export function InvoiceDocument({ invoice, lines, client, business }: Data) {
  const c = invoice.currency;
  const theme = parseTheme(invoice.theme ?? business?.theme);
  const brand = theme.accentColor;
  const fontFamily = pdfFontFamily(theme.font);
  const styles = makeStyles(theme);
  const bg = backgroundHex(theme.background);
  const paidBg = backgroundHex(theme.paid.tint);
  const zebra = theme.tableStyle === "zebra";
  const centered = theme.logo.placement === "center";
  const logoPx = { s: 28, m: 40, l: 56 }[theme.logo.size];
  const logoEl = theme.logo.url ? (
    theme.logo.shape === "square" ? (
      <Image src={theme.logo.url} style={{ height: logoPx, marginBottom: 6 }} />
    ) : (
      <View
        style={{
          width: logoPx,
          height: logoPx,
          marginBottom: 6,
          borderRadius: theme.logo.shape === "circle" ? logoPx / 2 : 6,
          overflow: "hidden",
        }}
      >
        <Image src={theme.logo.url} style={{ width: logoPx, height: logoPx, objectFit: "cover" }} />
      </View>
    )
  ) : null;
  return (
    <Document title={invoice.number}>
      <Page size="A4" style={[styles.page, { fontFamily }, bg ? { backgroundColor: bg } : {}]}>
        {theme.layout === "bold" ? (
          <View
            style={[
              styles.boldBanner,
              { backgroundColor: brand },
              centered ? { flexDirection: "column", alignItems: "center" } : {},
            ]}
          >
            <View style={centered ? { alignItems: "center" } : {}}>
              {logoEl}
              <Text style={[styles.boldName, centered ? { textAlign: "center" } : {}]}>
                {business?.businessName ?? "Invoice"}
              </Text>
              {business?.address ? (
                <Text style={[styles.boldAddress, centered ? { textAlign: "center" } : {}]}>
                  {business.address}
                </Text>
              ) : null}
            </View>
            <View style={centered ? { alignItems: "center", marginTop: 8 } : {}}>
              <Text style={[styles.boldNumber, centered ? { textAlign: "center" } : {}]}>
                {`Inv #${invoice.number}`}
              </Text>
              <Text style={[styles.boldStatus, centered ? { textAlign: "center" } : {}]}>
                {statusLabels[invoice.status] ?? invoice.status}
              </Text>
            </View>
          </View>
        ) : (
          <View style={centered ? styles.headerCenter : styles.headerRow}>
            <View style={centered ? { alignItems: "center" } : {}}>
              {logoEl}
              <Text style={theme.layout === "minimal" ? styles.businessMinimal : styles.business}>
                {business?.businessName ?? "Invoice"}
              </Text>
              {theme.layout === "classic" ? (
                <View
                  style={[
                    styles.brandRule,
                    { backgroundColor: brand },
                    centered ? { alignSelf: "center" } : {},
                  ]}
                />
              ) : null}
              {business?.address ? (
                <Text style={[styles.address, centered ? { textAlign: "center" } : {}]}>
                  {business.address}
                </Text>
              ) : null}
            </View>
            <View style={centered ? { alignItems: "center", marginTop: 8 } : {}}>
              <Text
                style={[
                  styles.number,
                  centered ? { textAlign: "center" } : {},
                  theme.layout === "classic"
                    ? { color: brand }
                    : theme.layout === "minimal"
                      ? { color: faint }
                      : {},
                ]}
              >
                {`Inv #${invoice.number}`}
              </Text>
              <Text style={[styles.status, centered ? { textAlign: "center" } : {}]}>
                {statusLabels[invoice.status] ?? invoice.status}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.label}>BILLED TO</Text>
            <Text style={styles.strong}>{client?.name ?? "Client"}</Text>
            {client?.company ? <Text style={{ color: muted }}>{client.company}</Text> : null}
            {client?.email ? <Text style={{ color: muted }}>{client.email}</Text> : null}
          </View>
          <View>
            <Text style={styles.label}>ISSUED</Text>
            <Text>{formatDate(invoice.issueDate)}</Text>
            {theme.fields.showDueDate ? (
              <>
                <Text style={[styles.label, { marginTop: 8 }]}>DUE</Text>
                <Text>{formatDate(invoice.dueDate)}</Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.tableHead}>
            <Text style={styles.cDesc}>Description</Text>
            {theme.fields.showQty ? <Text style={styles.cQty}>Qty</Text> : null}
            {theme.fields.showUnit ? <Text style={styles.cUnit}>Unit</Text> : null}
            <Text style={styles.cAmount}>Amount</Text>
          </View>
          {lines.map((l, i) => (
            <View
              style={zebra && i % 2 === 1 ? [styles.row, styles.rowZebra] : styles.row}
              key={l.id}
            >
              <Text style={styles.cDesc}>{l.description}</Text>
              {theme.fields.showQty ? (
                <Text style={styles.cQty}>{formatQuantity(l.quantity)}</Text>
              ) : null}
              {theme.fields.showUnit ? (
                <Text style={styles.cUnit}>{formatMoney(l.unitAmount, c)}</Text>
              ) : null}
              <Text style={styles.cAmount}>{formatMoney(l.amount, c)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={{ color: muted }}>Subtotal</Text>
            <Text>{formatMoney(invoice.subtotal, c)}</Text>
          </View>
          {theme.fields.showTaxDiscount && invoice.discount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={{ color: muted }}>Discount</Text>
              <Text>-{formatMoney(invoice.discount, c)}</Text>
            </View>
          ) : null}
          {theme.fields.showTaxDiscount && invoice.taxTotal > 0 ? (
            <View style={styles.totalRow}>
              <Text style={{ color: muted }}>Tax</Text>
              <Text>{formatMoney(invoice.taxTotal, c)}</Text>
            </View>
          ) : null}
          <View style={[styles.totalRow, styles.grand]}>
            <Text style={styles.strong}>Total due</Text>
            <Text style={styles.strong}>{formatMoney(invoice.total, c)}</Text>
          </View>
        </View>

        {theme.fields.showNotes && invoice.notes ? (
          <Text style={styles.notes}>{invoice.notes}</Text>
        ) : null}
        {theme.payment ? (
          <View style={styles.payment}>
            <Text style={styles.paymentLabel}>Payment details</Text>
            <Text>{theme.payment}</Text>
          </View>
        ) : null}
        {invoice.status === "paid" ? (
          <View
            style={[
              styles.paidBox,
              paidBg ? { backgroundColor: paidBg } : { borderWidth: 1, borderColor: line },
            ]}
          >
            <Text style={styles.paidTitle}>{theme.paid.title}</Text>
            {theme.paid.note ? <Text style={styles.paidNote}>{theme.paid.note}</Text> : null}
          </View>
        ) : null}

        <View style={styles.footer}>
          {theme.footer ? <Text style={styles.footerNote}>{theme.footer}</Text> : null}
          <View style={styles.poweredRow}>
            <Image src={PAYLINE_LOGO} style={styles.poweredLogo} />
            <Text>Powered by Payline</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
