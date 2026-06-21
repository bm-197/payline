"use client";

import { Maximize2, X } from "lucide-react";
import { type ReactNode, useEffect, useState, useTransition } from "react";
import { InvoiceView, type InvoiceViewData } from "@/components/invoices/invoice-view";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Field, Input, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import {
  DENSITIES,
  FONT_LABELS,
  FONT_OPTIONS,
  type InvoiceTheme,
  LAYOUT_LABELS,
  LAYOUTS,
  LOGO_PLACEMENTS,
  LOGO_SIZES,
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

  const deviceTabs = (
    <div className="inline-flex items-center rounded-full border border-line bg-canvas p-1 text-sm">
      {(["desktop", "mobile"] as const).map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => setDevice(d)}
          className={cn(
            "rounded-full px-4 py-1.5 capitalize transition-all",
            device === d ? "bg-card font-medium text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {d}
        </button>
      ))}
    </div>
  );

  const previewDoc = (
    <InvoiceView
      data={sample}
      theme={theme}
      status="sent"
      appUrl={appUrl}
      paymentSlot={
        <div
          style={{ backgroundColor: theme.accentColor }}
          className="rounded-xl px-4 py-3 text-center text-sm font-medium text-white"
        >
          {payLabel}
        </div>
      }
      footerSlot={<span className="underline-offset-4">Download PDF</span>}
    />
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* Controls */}
      <div className="space-y-6">
        <Group title="Layout">
          <PillGroup
            options={LAYOUTS.map((l) => ({ value: l, label: LAYOUT_LABELS[l] }))}
            value={theme.layout}
            onChange={(layout) => patch({ layout })}
          />
        </Group>

        <Group title="Typeface">
          <PillGroup
            options={FONT_OPTIONS.map((f) => ({ value: f, label: FONT_LABELS[f] }))}
            value={theme.font}
            onChange={(font) => patch({ font })}
          />
        </Group>

        <Group title="Accent color">
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
        </Group>

        <Group title="Text size">
          <PillGroup
            options={TEXT_SCALES.map((s) => ({ value: s, label: SCALE_LABELS[s] ?? s }))}
            value={theme.textScale}
            onChange={(textScale) => patch({ textScale })}
          />
        </Group>

        <Group title="Density">
          <PillGroup
            options={DENSITIES.map((d) => ({ value: d, label: DENSITY_LABELS[d] ?? d }))}
            value={theme.density}
            onChange={(density) => patch({ density })}
          />
        </Group>

        <Group title="Logo">
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
                options={LOGO_PLACEMENTS.map((p) => ({
                  value: p,
                  label: PLACEMENT_LABELS[p] ?? p,
                }))}
                value={theme.logo.placement}
                onChange={(placement) => patch({ logo: { ...theme.logo, placement } })}
              />
            </div>
          </div>
        </Group>

        <Group title="Footer">
          <Textarea
            value={theme.footer}
            maxLength={300}
            placeholder="Payment terms, a thank-you, bank details."
            onChange={(e) => patch({ footer: e.target.value })}
          />
        </Group>

        <Group title="Show on invoice">
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
          </div>
        </Group>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {deviceTabs}
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              aria-label="Full page preview"
              title="Full page preview"
              className="rounded-full border border-line bg-canvas p-2.5 text-muted transition-all hover:bg-card hover:text-ink hover:shadow-sm"
            >
              <Maximize2 className="size-4" strokeWidth={1.6} />
            </button>
          </div>
          <div className="flex items-center gap-3">
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
        </div>
        {error ? <p className="mb-3 text-sm text-blush-deep">{error}</p> : null}

        <div className="rounded-3xl bg-canvas p-4 sm:p-8">
          <div
            className={cn("mx-auto transition-all", device === "mobile" ? "max-w-sm" : "max-w-2xl")}
          >
            {previewDoc}
          </div>
        </div>
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-10">
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

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line/70 bg-card/70 p-4 shadow-sm">
      <p className="mb-3 font-geist text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
        {title}
      </p>
      {children}
    </section>
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
