import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BusinessProfile, Client, Invoice, LineItem } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import { baseFontPx, densityScale, type InvoiceTheme, parseTheme } from "@/lib/invoices/theme";
import { formatMoney, formatQuantity } from "@/lib/money";
import { pdfFontFamily, registerPdfFonts } from "./fonts";

registerPdfFonts();

const ink = "#19191d";
const muted = "#626275";
const faint = "#898b91";
const line = "#e7e9ef";

// Styles scale with the theme's text size + density so the PDF tracks the page.
function makeStyles(theme: InvoiceTheme) {
  const f = baseFontPx(theme.textScale) / 14;
  const d = densityScale(theme.density);
  const fs = (px: number) => Math.round(px * f);
  const sp = (px: number) => Math.round(px * d);
  return StyleSheet.create({
    page: { padding: sp(40), fontSize: fs(10), color: ink },
    headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: sp(28) },
    business: { fontSize: fs(15), fontWeight: "bold" },
    address: { color: muted, fontSize: fs(8), marginTop: 4, lineHeight: 1.4 },
    number: { fontSize: fs(11), fontWeight: "bold", textAlign: "right" },
    status: { color: faint, fontSize: fs(9), textAlign: "right", marginTop: 3 },
    metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: sp(24) },
    label: { color: faint, fontSize: fs(8), marginBottom: 2 },
    strong: { fontWeight: "bold" },
    tableHead: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: line,
      paddingBottom: 6,
      color: faint,
      fontSize: fs(8),
      textTransform: "uppercase",
    },
    row: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: line,
      paddingVertical: sp(7),
    },
    cDesc: { flex: 1 },
    cQty: { width: 60, textAlign: "right" },
    cUnit: { width: 80, textAlign: "right" },
    cAmount: { width: 80, textAlign: "right" },
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
    paid: { marginTop: sp(24), color: "#4a6b4c", fontWeight: "bold" },
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
  return (
    <Document title={invoice.number}>
      <Page size="A4" style={[styles.page, { fontFamily }]}>
        {theme.layout === "bold" ? (
          <View style={[styles.boldBanner, { backgroundColor: brand }]}>
            <View>
              <Text style={styles.boldName}>{business?.businessName ?? "Invoice"}</Text>
              {business?.address ? (
                <Text style={styles.boldAddress}>{business.address}</Text>
              ) : null}
            </View>
            <View>
              <Text style={styles.boldNumber}>{`Inv #${invoice.number}`}</Text>
              <Text style={styles.boldStatus}>
                {statusLabels[invoice.status] ?? invoice.status}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <View>
              <Text style={theme.layout === "minimal" ? styles.businessMinimal : styles.business}>
                {business?.businessName ?? "Invoice"}
              </Text>
              {theme.layout === "classic" ? (
                <View style={[styles.brandRule, { backgroundColor: brand }]} />
              ) : null}
              {business?.address ? <Text style={styles.address}>{business.address}</Text> : null}
            </View>
            <View>
              <Text
                style={[
                  styles.number,
                  theme.layout === "classic"
                    ? { color: brand }
                    : theme.layout === "minimal"
                      ? { color: faint }
                      : {},
                ]}
              >
                {`Inv #${invoice.number}`}
              </Text>
              <Text style={styles.status}>{statusLabels[invoice.status] ?? invoice.status}</Text>
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

        <View style={styles.tableHead}>
          <Text style={styles.cDesc}>Description</Text>
          <Text style={styles.cQty}>Qty</Text>
          <Text style={styles.cUnit}>Unit</Text>
          <Text style={styles.cAmount}>Amount</Text>
        </View>
        {lines.map((l) => (
          <View style={styles.row} key={l.id}>
            <Text style={styles.cDesc}>{l.description}</Text>
            <Text style={styles.cQty}>{formatQuantity(l.quantity)}</Text>
            <Text style={styles.cUnit}>{formatMoney(l.unitAmount, c)}</Text>
            <Text style={styles.cAmount}>{formatMoney(l.amount, c)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={{ color: muted }}>Subtotal</Text>
            <Text>{formatMoney(invoice.subtotal, c)}</Text>
          </View>
          {invoice.discount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={{ color: muted }}>Discount</Text>
              <Text>-{formatMoney(invoice.discount, c)}</Text>
            </View>
          ) : null}
          {invoice.taxTotal > 0 ? (
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
        {invoice.status === "paid" ? <Text style={styles.paid}>PAID IN FULL</Text> : null}

        <View style={styles.footer}>
          {theme.footer ? <Text style={styles.footerNote}>{theme.footer}</Text> : null}
          <Text>Powered by Payline</Text>
        </View>
      </Page>
    </Document>
  );
}
