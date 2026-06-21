"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession } from "@/lib/invoices/checkout";

export function PayButton({
  token,
  amountLabel,
  brandColor,
}: {
  token: string;
  amountLabel: string;
  brandColor?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pay() {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession(token);
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setError(result.error ?? "Could not start checkout.");
    });
  }

  const branded = brandColor
    ? "w-full rounded-xl px-4 py-3 font-medium text-white shadow-xl transition motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99] disabled:opacity-60"
    : "w-full rounded-xl bg-linear-to-b from-zinc-800 to-black px-4 py-3 font-medium text-white shadow-xl shadow-zinc-900/20 transition motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99] disabled:opacity-60";

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={pay}
        disabled={pending}
        style={brandColor ? { backgroundColor: brandColor } : undefined}
        className={branded}
      >
        {pending ? "Redirecting to checkout..." : `Pay ${amountLabel}`}
      </button>
      {error ? <p className="mt-2 text-xs text-blush-deep">{error}</p> : null}
      <p className="mt-2 text-xs text-faint">Secure card payment via Stripe.</p>
    </div>
  );
}
