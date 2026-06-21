import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BusinessProfile, Client, Invoice, LineItem } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import { formatMoney, formatQuantity } from "@/lib/money";

const ink = "#19191d";
const muted = "#626275";
const faint = "#898b91";
const line = "#e7e9ef";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: ink, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  business: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  address: { color: muted, fontSize: 8, marginTop: 4, lineHeight: 1.4 },
  number: { fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "right" },
  status: { color: faint, fontSize: 9, textAlign: "right", marginTop: 3 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  label: { color: faint, fontSize: 8, marginBottom: 2 },
  strong: { fontFamily: "Helvetica-Bold" },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: line,
    paddingBottom: 6,
    color: faint,
    fontSize: 8,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: line,
    paddingVertical: 7,
  },
  cDesc: { flex: 1 },
  cQty: { width: 60, textAlign: "right" },
  cUnit: { width: 80, textAlign: "right" },
  cAmount: { width: 80, textAlign: "right" },
  totals: { marginTop: 18, marginLeft: "auto", width: 200 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: { borderTopWidth: 1, borderTopColor: line, marginTop: 4, paddingTop: 6 },
  notes: { marginTop: 24, color: muted, borderTopWidth: 1, borderTopColor: line, paddingTop: 10 },
  paid: { marginTop: 24, color: "#4a6b4c", fontFamily: "Helvetica-Bold" },
});

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
  return (
    <Document title={invoice.number}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.business}>{business?.businessName ?? "Invoice"}</Text>
            {business?.address ? <Text style={styles.address}>{business.address}</Text> : null}
          </View>
          <View>
            <Text style={styles.number}>{invoice.number}</Text>
            <Text style={styles.status}>{statusLabels[invoice.status] ?? invoice.status}</Text>
          </View>
        </View>

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
            <Text style={[styles.label, { marginTop: 8 }]}>DUE</Text>
            <Text>{formatDate(invoice.dueDate)}</Text>
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

        {invoice.notes ? <Text style={styles.notes}>{invoice.notes}</Text> : null}
        {invoice.status === "paid" ? <Text style={styles.paid}>PAID IN FULL</Text> : null}
      </Page>
    </Document>
  );
}
