"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import type { ClientFormState } from "@/lib/clients/actions";

type Defaults = {
  name?: string;
  email?: string | null;
  company?: string | null;
  address?: string | null;
  notes?: string | null;
};

export function ClientForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ClientFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Name" htmlFor="name" error={state.error}>
        <Input id="name" name="name" required defaultValue={defaults?.name ?? ""} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={defaults?.email ?? ""} />
        </Field>
        <Field label="Company" htmlFor="company">
          <Input id="company" name="company" defaultValue={defaults?.company ?? ""} />
        </Field>
      </div>
      <Field label="Address" htmlFor="address">
        <Textarea id="address" name="address" defaultValue={defaults?.address ?? ""} />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={defaults?.notes ?? ""} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
        <Link href="/clients">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
