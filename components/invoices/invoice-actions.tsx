"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  type InvoiceActionState,
  markPaidAction,
  sendInvoiceAction,
  voidInvoiceAction,
} from "@/lib/invoices/actions";
import type { StoredStatus } from "@/lib/invoices/state";

export function InvoiceActions({
  id,
  status,
  token,
}: {
  id: string;
  status: StoredStatus;
  token: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingVoid, setConfirmingVoid] = useState(false);

  function run(action: () => Promise<InvoiceActionState>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  const terminal = status === "paid" || status === "void";

  return (
    <div className="space-y-3">
      {status === "draft" ? (
        <Button
          className="w-full"
          disabled={pending}
          onClick={() => run(() => sendInvoiceAction(id))}
        >
          {pending ? "Working..." : "Send invoice"}
        </Button>
      ) : null}

      {status === "sent" || status === "viewed" ? (
        <Button className="w-full" disabled={pending} onClick={() => run(() => markPaidAction(id))}>
          {pending ? "Working..." : "Mark as paid"}
        </Button>
      ) : null}

      <a href={`/i/${token}/pdf`} target="_blank" rel="noreferrer" className="block">
        <Button variant="secondary" className="w-full">
          Download PDF
        </Button>
      </a>

      {!terminal ? (
        confirmingVoid ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Void this invoice?</span>
            <span className="flex items-center gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => voidInvoiceAction(id))}
                className="font-medium text-blush-deep"
              >
                Confirm
              </button>
              <button type="button" onClick={() => setConfirmingVoid(false)} className="text-faint">
                Cancel
              </button>
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingVoid(true)}
            className="block w-full text-center text-sm text-muted transition hover:text-blush-deep"
          >
            Void invoice
          </button>
        )
      ) : null}

      {error ? <p className="text-sm text-blush-deep">{error}</p> : null}
    </div>
  );
}
