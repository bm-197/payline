"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { MoneyText } from "@/components/ui/money-text";
import { createDraftInvoiceAction } from "@/lib/invoices/actions";
import {
  computeInvoiceTotals,
  formatMoney,
  parseAmountToMinor,
  parseQuantity,
  parseTaxRate,
} from "@/lib/money";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currency";

type Line = { key: number; description: string; qty: string; unit: string };
type ClientOption = { id: string; name: string };

function safeMinor(value: string, currency: string): number {
  try {
    return parseAmountToMinor(value || "0", currency);
  } catch {
    return 0;
  }
}
function safeQty(value: string): number {
  try {
    return parseQuantity(value || "0");
  } catch {
    return 0;
  }
}
function safeTax(value: string): number {
  try {
    return parseTaxRate(value || "0");
  } catch {
    return 0;
  }
}

export function InvoiceBuilder({
  clients,
  defaults,
}: {
  clients: ClientOption[];
  defaults: { currency: string; taxRate: string; issueDate: string; dueDate: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const keyRef = useRef(2);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [currency, setCurrency] = useState(defaults.currency);
  const [issueDate, setIssueDate] = useState(defaults.issueDate);
  const [dueDate, setDueDate] = useState(defaults.dueDate);
  const [taxRate, setTaxRate] = useState(defaults.taxRate);
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { key: 0, description: "", qty: "1", unit: "" },
    { key: 1, description: "", qty: "1", unit: "" },
  ]);

  const totals = useMemo(
    () =>
      computeInvoiceTotals({
        lines: lines.map((l) => ({
          quantity: safeQty(l.qty),
          unitAmount: safeMinor(l.unit, currency),
        })),
        discount: safeMinor(discount, currency),
        taxRateBps: safeTax(taxRate),
      }),
    [lines, discount, taxRate, currency],
  );

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, { key: keyRef.current++, description: "", qty: "1", unit: "" }]);
  }
  function removeLine(key: number) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createDraftInvoiceAction({
        clientId,
        currency: currency as (typeof SUPPORTED_CURRENCIES)[number],
        issueDate,
        dueDate,
        taxRate,
        discount,
        notes,
        lines: lines.map((l) => ({
          description: l.description,
          quantity: l.qty,
          unitAmount: l.unit,
        })),
      });
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  if (clients.length === 0) {
    return (
      <p className="text-sm text-muted">Add a client first, then come back to build the invoice.</p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="grid gap-5 rounded-3xl border border-line bg-card p-6 sm:grid-cols-2">
          <Field label="Client" htmlFor="client">
            <Select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Currency" htmlFor="currency">
            <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Issue date" htmlFor="issue">
            <Input
              id="issue"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </Field>
          <Field label="Due date" htmlFor="due">
            <Input
              id="due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>

        <div className="rounded-3xl border border-line bg-card p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Line items</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addLine}>
              Add line
            </Button>
          </div>
          <div className="space-y-3">
            {lines.map((l) => {
              const amount = computeInvoiceTotals({
                lines: [{ quantity: safeQty(l.qty), unitAmount: safeMinor(l.unit, currency) }],
              }).subtotal;
              return (
                <div
                  key={l.key}
                  className="grid grid-cols-[1fr_72px_104px_104px_28px] items-center gap-2"
                >
                  <Input
                    placeholder="Description"
                    value={l.description}
                    onChange={(e) => updateLine(l.key, { description: e.target.value })}
                  />
                  <Input
                    inputMode="decimal"
                    aria-label="Quantity"
                    value={l.qty}
                    onChange={(e) => updateLine(l.key, { qty: e.target.value })}
                  />
                  <Input
                    inputMode="decimal"
                    aria-label="Unit price"
                    placeholder="0.00"
                    value={l.unit}
                    onChange={(e) => updateLine(l.key, { unit: e.target.value })}
                  />
                  <div className="text-right text-sm">
                    <MoneyText>{formatMoney(amount, currency)}</MoneyText>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(l.key)}
                    className="text-faint transition hover:text-blush-deep disabled:opacity-30"
                    disabled={lines.length === 1}
                    aria-label="Remove line"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <Field label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment terms, a thank-you, anything the client should see."
          />
        </Field>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-line bg-card p-6">
          <dl className="space-y-3 text-sm">
            <Row label="Subtotal">
              <MoneyText>{formatMoney(totals.subtotal, currency)}</MoneyText>
            </Row>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Discount</dt>
              <Input
                inputMode="decimal"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-28 text-right"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Tax rate %</dt>
              <Input
                inputMode="decimal"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-28 text-right"
              />
            </div>
            <Row label="Tax">
              <MoneyText>{formatMoney(totals.taxTotal, currency)}</MoneyText>
            </Row>
            <div className="border-t border-line pt-3">
              <Row label="Total">
                <span className="text-base font-semibold">
                  <MoneyText>{formatMoney(totals.total, currency)}</MoneyText>
                </span>
              </Row>
            </div>
          </dl>
        </div>

        {error ? <p className="text-sm text-blush-deep">{error}</p> : null}

        <Button type="button" onClick={onSubmit} disabled={pending} className="w-full">
          {pending ? "Saving..." : "Save draft"}
        </Button>
      </aside>
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
