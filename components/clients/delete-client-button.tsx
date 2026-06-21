"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteClientAction } from "@/lib/clients/actions";

export function DeleteClientButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (disabled) {
    return (
      <span className="text-xs text-faint" title="Clients with invoices can't be deleted.">
        In use
      </span>
    );
  }

  function onDelete() {
    startTransition(async () => {
      await deleteClientAction(id);
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-muted transition hover:text-blush-deep"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="font-medium text-blush-deep"
      >
        {pending ? "Removing..." : "Confirm"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="text-faint">
        Cancel
      </button>
    </span>
  );
}
