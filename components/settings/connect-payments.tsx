"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startStripeOnboarding } from "@/lib/settings/connect-actions";

export function ConnectPayments({
  connected,
  chargesEnabled,
}: {
  connected: boolean;
  chargesEnabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onboard() {
    setError(null);
    startTransition(async () => {
      const result = await startStripeOnboarding();
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <section className="space-y-4 rounded-3xl border border-line bg-card p-6">
      <div>
        <h2 className="text-sm font-medium">Payouts</h2>
        <p className="mt-1 text-sm text-muted">
          Connect a Stripe account so card payments land in your bank, not ours. Payline takes a 1%
          fee per paid invoice.
        </p>
      </div>

      {chargesEnabled ? (
        <div className="flex items-center gap-2 rounded-xl bg-sage/60 px-4 py-3 text-sm">
          <span aria-hidden className="text-sage-deep">
            ✓
          </span>
          Payouts are active. Clients can pay you by card.
        </div>
      ) : (
        <div className="space-y-3">
          {connected ? (
            <p className="text-sm text-muted">
              Your Stripe account needs a few more details before payouts can start.
            </p>
          ) : null}
          <Button onClick={onboard} disabled={pending}>
            {pending ? "Opening Stripe..." : connected ? "Finish payout setup" : "Connect payouts"}
          </Button>
          {error ? <p className="text-sm text-blush-deep">{error}</p> : null}
        </div>
      )}
    </section>
  );
}
