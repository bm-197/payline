"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currency";
import type { SettingsState } from "@/lib/settings/actions";

const OFFSETS: { value: number; label: string }[] = [
  { value: -7, label: "7 days before" },
  { value: -3, label: "3 days before" },
  { value: -1, label: "1 day before" },
  { value: 0, label: "On the due date" },
  { value: 1, label: "1 day after" },
  { value: 3, label: "3 days after" },
  { value: 7, label: "7 days after" },
  { value: 14, label: "14 days after" },
];

type Defaults = {
  businessName: string;
  address: string | null;
  logoUrl: string | null;
  defaultCurrency: string;
  taxRate: string;
  paymentTermsDays: number;
  offsets: number[];
};

export function SettingsForm({
  action,
  defaults,
}: {
  action: (state: SettingsState, formData: FormData) => Promise<SettingsState>;
  defaults: Defaults;
}) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-5 rounded-3xl border border-line bg-card p-6">
        <h2 className="text-sm font-medium">Business profile</h2>
        <Field label="Business name" htmlFor="businessName" error={state.error}>
          <Input
            id="businessName"
            name="businessName"
            defaultValue={defaults.businessName}
            required
          />
        </Field>
        <Field label="Address" htmlFor="address">
          <Textarea id="address" name="address" defaultValue={defaults.address ?? ""} />
        </Field>
        <Field
          label="Logo URL"
          htmlFor="logoUrl"
          hint="A link to your logo image. Shown on the hosted invoice."
        >
          <Input
            id="logoUrl"
            name="logoUrl"
            type="url"
            placeholder="https://..."
            defaultValue={defaults.logoUrl ?? ""}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Default currency" htmlFor="defaultCurrency">
            <Select
              id="defaultCurrency"
              name="defaultCurrency"
              defaultValue={defaults.defaultCurrency}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Default tax rate %" htmlFor="taxRate">
            <Input
              id="taxRate"
              name="taxRate"
              inputMode="decimal"
              defaultValue={defaults.taxRate}
            />
          </Field>
          <Field label="Payment terms (days)" htmlFor="paymentTermsDays">
            <Input
              id="paymentTermsDays"
              name="paymentTermsDays"
              inputMode="numeric"
              defaultValue={String(defaults.paymentTermsDays)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-line bg-card p-6">
        <div>
          <h2 className="text-sm font-medium">Reminder schedule</h2>
          <p className="mt-1 text-sm text-muted">
            When to nudge a client about an unpaid invoice, relative to its due date. A reminder is
            skipped once the invoice is paid.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {OFFSETS.map((o) => (
            <label key={o.value} className="cursor-pointer">
              <input
                type="checkbox"
                name="offsets"
                value={o.value}
                defaultChecked={defaults.offsets.includes(o.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "inline-flex rounded-full border border-line px-3 py-1.5 text-sm text-muted transition-colors",
                  "peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ink/20",
                )}
              >
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
        {state.ok ? <span className="text-sm text-sage-deep">Saved.</span> : null}
      </div>
    </form>
  );
}
