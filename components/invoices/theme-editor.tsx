"use client";

import { Maximize2, X } from "lucide-react";
import { type ReactNode, useEffect, useState, useTransition } from "react";
import { InvoiceView, type InvoiceViewData } from "@/components/invoices/invoice-view";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Field, Input, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import {
  BACKGROUNDS,
  DENSITIES,
  FONT_LABELS,
  FONT_OPTIONS,
  type InvoiceTheme,
  LAYOUT_LABELS,
  LAYOUTS,
  LOGO_PLACEMENTS,
  LOGO_SHAPES,
  LOGO_SIZES,
  paidTintClass,
  TABLE_STYLES,
  TEXT_SCALES,
} from "@/lib/invoices/theme";
import { saveInvoiceThemeAction } from "@/lib/invoices/theme-actions";
import { formatMoney } from "@/lib/money";

const BRAND_COLORS = ["#19191d", "#1a73e8", "#15803d", "#7c3aed", "#be123c", "#b45309"];
const SCALE_LABELS: Record<string, string> = { s: "Small", m: "Medium", l: "Large" };
const DENSITY_LABELS: Record<string, string> = {
  compact: "Compact",
  normal: "Normal",
  roomy: "Roomy",
};
const LOGO_SIZE_LABELS: Record<string, string> = { s: "Small", m: "Medium", l: "Large" };
const PLACEMENT_LABELS: Record<string, string> = { left: "Left", center: "Center" };
const LOGO_SHAPE_LABELS: Record<string, string> = {
  square: "Square",
  rounded: "Rounded",
  circle: "Circle",
};
const TABLE_STYLE_LABELS: Record<string, string> = {
  lines: "Lines",
  zebra: "Zebra",
  bordered: "Bordered",
  minimal: "Minimal",
};
const BACKGROUND_LABELS: Record<string, string> = {
  none: "None",
  blush: "Blush",
  sage: "Sage",
  peri: "Peri",
};

type Tab = "style" | "brand" | "content";

export function ThemeEditor({
  savedTheme,
  sample,
  appUrl,
}: {
  savedTheme: InvoiceTheme;
  sample: InvoiceViewData;
  appUrl: string;
}) {
  const [theme, setTheme] = useState(savedTheme);
  const [baseline, setBaseline] = useState(savedTheme);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewState, setPreviewState] = useState<"sent" | "paid">("sent");
  const [tab, setTab] = useState<Tab>("style");
  const [fullscreen, setFullscreen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);

  const dirty = JSON.stringify(theme) !== JSON.stringify(baseline);

  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  function patch(p: Partial<InvoiceTheme>) {
    setTheme((t) => ({ ...t, ...p }));
    setSavedAt(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveInvoiceThemeAction(theme);
      if (result.error) {
        setError(result.error);
        return;
      }
      setBaseline(theme);
      setSavedAt(true);
    });
  }

  async function previewPdf() {
    setError(null);
    setPdfPending(true);
    try {
      const res = await fetch("/api/invoice-design/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (!res.ok) throw new Error("render failed");
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
    } catch {
      setError("Could not render the PDF preview. Please try again.");
    } finally {
      setPdfPending(false);
    }
  }

  const payLabel = `Pay ${formatMoney(sample.invoice.total, sample.invoice.currency)}`;

  // --- Individual controls, composed differently by each variant ---
  const layoutCtl = (
    <PillGroup
      options={LAYOUTS.map((l) => ({ value: l, label: LAYOUT_LABELS[l] }))}
      value={theme.layout}
      onChange={(layout) => patch({ layout })}
    />
  );
  const typefaceCtl = (
    <PillGroup
      options={FONT_OPTIONS.map((f) => ({ value: f, label: FONT_LABELS[f] }))}
      value={theme.font}
      onChange={(font) => patch({ font })}
    />
  );
  const accentCtl = (
    <div className="flex flex-wrap items-center gap-2">
      {BRAND_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Use ${c}`}
          onClick={() => patch({ accentColor: c })}
          style={{ backgroundColor: c }}
          className={cn(
            "size-8 rounded-full transition",
            theme.accentColor.toLowerCase() === c
              ? "ring-2 ring-ink ring-offset-2 ring-offset-canvas"
              : "ring-1 ring-line",
          )}
        />
      ))}
      <ColorPicker
        className="ml-1"
        value={theme.accentColor}
        onChange={(accentColor) => patch({ accentColor })}
      />
    </div>
  );
  const textSizeCtl = (
    <PillGroup
      options={TEXT_SCALES.map((s) => ({ value: s, label: SCALE_LABELS[s] ?? s }))}
      value={theme.textScale}
      onChange={(textScale) => patch({ textScale })}
    />
  );
  const densityCtl = (
    <PillGroup
      options={DENSITIES.map((d) => ({ value: d, label: DENSITY_LABELS[d] ?? d }))}
      value={theme.density}
      onChange={(density) => patch({ density })}
    />
  );
  const tableStyleCtl = (
    <PillGroup
      options={TABLE_STYLES.map((t) => ({ value: t, label: TABLE_STYLE_LABELS[t] ?? t }))}
      value={theme.tableStyle}
      onChange={(tableStyle) => patch({ tableStyle })}
    />
  );
  const backgroundCtl = (
    <PillGroup
      options={BACKGROUNDS.map((b) => ({ value: b, label: BACKGROUND_LABELS[b] ?? b }))}
      value={theme.background}
      onChange={(background) => patch({ background })}
    />
  );
  const paymentCtl = (
    <Textarea
      value={theme.payment}
      maxLength={500}
      placeholder="Bank name, account number, payment link, etc."
      onChange={(e) => patch({ payment: e.target.value })}
    />
  );
  const logoCtl = (
    <>
      <Field label="Logo URL" htmlFor="logoUrl">
        <Input
          id="logoUrl"
          type="url"
          placeholder="https://..."
          value={theme.logo.url ?? ""}
          onChange={(e) => patch({ logo: { ...theme.logo, url: e.target.value || null } })}
        />
      </Field>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-xs text-faint">Size</p>
          <PillGroup
            options={LOGO_SIZES.map((s) => ({ value: s, label: LOGO_SIZE_LABELS[s] ?? s }))}
            value={theme.logo.size}
            onChange={(size) => patch({ logo: { ...theme.logo, size } })}
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs text-faint">Placement</p>
          <PillGroup
            options={LOGO_PLACEMENTS.map((p) => ({ value: p, label: PLACEMENT_LABELS[p] ?? p }))}
            value={theme.logo.placement}
            onChange={(placement) => patch({ logo: { ...theme.logo, placement } })}
          />
        </div>
      </div>
      <div className="mt-3">
        <p className="mb-1.5 text-xs text-faint">Shape</p>
        <PillGroup
          options={LOGO_SHAPES.map((s) => ({ value: s, label: LOGO_SHAPE_LABELS[s] ?? s }))}
          value={theme.logo.shape}
          onChange={(shape) => patch({ logo: { ...theme.logo, shape } })}
        />
      </div>
    </>
  );
  const footerCtl = (
    <Textarea
      value={theme.footer}
      maxLength={300}
      placeholder="Payment terms, a thank-you, bank details."
      onChange={(e) => patch({ footer: e.target.value })}
    />
  );
  const fieldsCtl = (
    <div className="space-y-2">
      <Toggle
        label="Due date"
        checked={theme.fields.showDueDate}
        onChange={(showDueDate) => patch({ fields: { ...theme.fields, showDueDate } })}
      />
      <Toggle
        label="Notes"
        checked={theme.fields.showNotes}
        onChange={(showNotes) => patch({ fields: { ...theme.fields, showNotes } })}
      />
      <Toggle
        label="Quantity column"
        checked={theme.fields.showQty}
        onChange={(showQty) => patch({ fields: { ...theme.fields, showQty } })}
      />
      <Toggle
        label="Unit price column"
        checked={theme.fields.showUnit}
        onChange={(showUnit) => patch({ fields: { ...theme.fields, showUnit } })}
      />
      <Toggle
        label="Tax & discount"
        checked={theme.fields.showTaxDiscount}
        onChange={(showTaxDiscount) => patch({ fields: { ...theme.fields, showTaxDiscount } })}
      />
    </div>
  );

  const deviceTabs = (
    <Segmented
      options={[
        { value: "desktop", label: "Desktop" },
        { value: "mobile", label: "Mobile" },
      ]}
      value={device}
      onChange={setDevice}
    />
  );

  const fullscreenBtn = (
    <button
      type="button"
      onClick={() => setFullscreen(true)}
      aria-label="Full page preview"
      title="Full page preview"
      className="rounded-full border border-line bg-canvas p-2.5 text-muted transition-all hover:bg-card hover:text-ink hover:shadow-sm"
    >
      <Maximize2 className="size-4" strokeWidth={1.6} />
    </button>
  );

  const previewDoc = (
    <InvoiceView
      data={sample}
      theme={theme}
      status={previewState}
      appUrl={appUrl}
      paymentSlot={
        previewState === "paid" ? (
          <button
            type="button"
            onClick={() => setPreviewState("sent")}
            title="Back to unpaid view"
            className={cn(
              paidTintClass(theme.paid.tint),
              "block w-full rounded-2xl px-5 py-4 text-center",
            )}
          >
            <p className="font-serif text-lg italic">{theme.paid.title}</p>
            {theme.paid.note ? <p className="mt-1 text-sm text-muted">{theme.paid.note}</p> : null}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPreviewState("paid")}
            title="Click to preview the paid state"
            style={{ backgroundColor: theme.accentColor }}
            className="block w-full rounded-xl px-4 py-3 text-center text-sm font-medium text-white"
          >
            {payLabel}
          </button>
        )
      }
      footerSlot={<span className="underline-offset-4">Download PDF</span>}
    />
  );

  const artboard = (
    <div className="thin-scrollbar rounded-3xl bg-canvas p-4 sm:px-8 sm:pb-8 sm:pt-2 lg:h-full lg:overflow-y-auto">
      <div className={cn("mx-auto transition-all", device === "mobile" ? "max-w-sm" : "max-w-2xl")}>
        {previewDoc}
      </div>
    </div>
  );

  const tabbedPanel = (
    <div className="flex flex-col gap-4 rounded-3xl border border-line/70 bg-card/70 p-4 shadow-sm">
      <Segmented
        full
        options={[
          { value: "style", label: "Style" },
          { value: "brand", label: "Brand" },
          { value: "content", label: "Content" },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="space-y-5 px-1">
        {tab === "style" ? (
          <>
            <Labeled title="Layout">{layoutCtl}</Labeled>
            <Labeled title="Table style">{tableStyleCtl}</Labeled>
            <Labeled title="Background">{backgroundCtl}</Labeled>
            <Labeled title="Typeface">{typefaceCtl}</Labeled>
            <Labeled title="Text size">{textSizeCtl}</Labeled>
            <Labeled title="Density">{densityCtl}</Labeled>
          </>
        ) : null}
        {tab === "brand" ? (
          <>
            <Labeled title="Accent color">{accentCtl}</Labeled>
            <Labeled title="Logo">{logoCtl}</Labeled>
          </>
        ) : null}
        {tab === "content" ? (
          <>
            <Labeled title="Footer">{footerCtl}</Labeled>
            <Labeled title="Payment details">{paymentCtl}</Labeled>
            <Labeled title="Show on invoice">{fieldsCtl}</Labeled>
          </>
        ) : null}
      </div>
    </div>
  );

  const paidPanel = (
    <div className="flex flex-col gap-4 rounded-3xl border border-line/70 bg-card/70 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-geist text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
          Paid confirmation
        </p>
        <button
          type="button"
          onClick={() => setPreviewState("sent")}
          className="text-sm text-muted transition hover:text-ink"
        >
          Back
        </button>
      </div>
      <div className="space-y-5 px-1">
        <Labeled title="Headline">
          <Input
            value={theme.paid.title}
            maxLength={60}
            onChange={(e) => patch({ paid: { ...theme.paid, title: e.target.value } })}
          />
        </Labeled>
        <Labeled title="Message">
          <Input
            value={theme.paid.note}
            maxLength={120}
            onChange={(e) => patch({ paid: { ...theme.paid, note: e.target.value } })}
          />
        </Labeled>
        <Labeled title="Tint">
          <PillGroup
            options={BACKGROUNDS.map((b) => ({ value: b, label: BACKGROUND_LABELS[b] ?? b }))}
            value={theme.paid.tint}
            onChange={(tint) => patch({ paid: { ...theme.paid, tint } })}
          />
        </Labeled>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Invoice design"
        subtitle="Style your invoices once. Every invoice and PDF follows it."
        action={
          <div className="flex flex-wrap items-center justify-end gap-3">
            {deviceTabs}
            {fullscreenBtn}
            {savedAt && !dirty ? <span className="text-sm text-sage-deep">Saved</span> : null}
            {dirty ? (
              <button
                type="button"
                onClick={() => setTheme(baseline)}
                className="text-sm text-muted transition hover:text-ink"
              >
                Discard
              </button>
            ) : null}
            <Button variant="secondary" onClick={previewPdf} disabled={pdfPending}>
              {pdfPending ? "Rendering..." : "Preview PDF"}
            </Button>
            <Button onClick={save} disabled={pending || !dirty}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        }
      />
      {error ? <p className="mb-3 text-sm text-blush-deep">{error}</p> : null}

      <div className="grid gap-6 lg:h-[calc(100dvh-12rem)] lg:min-h-[34rem] lg:grid-cols-[360px_1fr]">
        <div className="thin-scrollbar lg:overflow-y-auto lg:pr-1">
          {previewState === "paid" ? paidPanel : tabbedPanel}
        </div>
        {artboard}
      </div>

      {fullscreen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
          <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
            {deviceTabs}
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="Close full page preview"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-line/50 hover:text-ink"
            >
              <X className="size-4" strokeWidth={1.6} />
              Close
            </button>
          </div>
          <div className="thin-scrollbar flex-1 overflow-y-auto p-4 sm:p-10">
            <div
              className={cn(
                "mx-auto transition-all",
                device === "mobile" ? "max-w-sm" : "max-w-3xl",
              )}
            >
              {previewDoc}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Labeled({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-geist text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
        {title}
      </p>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  full,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  full?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-canvas p-1 text-sm",
        full && "flex w-full",
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-4 py-1.5 transition-all",
            full && "flex-1",
            value === o.value
              ? "bg-card font-medium text-ink shadow-sm"
              : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm transition-all",
            value === o.value
              ? "border-ink bg-ink text-white shadow-sm"
              : "border-line bg-card/50 text-muted hover:border-faint hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-ink" : "bg-line",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white transition-all",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}
