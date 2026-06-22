"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function AcceptInvite({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept() {
    setError(null);
    start(async () => {
      const res = await authClient.organization.acceptInvitation({ invitationId });
      if (res.error || !res.data) {
        setError("This invitation is no longer valid.");
        return;
      }
      const orgId = res.data.invitation?.organizationId;
      if (orgId) await authClient.organization.setActive({ organizationId: orgId });
      router.push("/dashboard");
      router.refresh();
    });
  }

  function decline() {
    start(async () => {
      await authClient.organization.rejectInvitation({ invitationId });
      router.push("/dashboard");
    });
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="glass w-full max-w-sm rounded-3xl p-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight">You've been invited</h1>
        <p className="mt-1 text-sm text-muted">Join this team to collaborate on its invoices.</p>
        {error ? <p className="mt-3 text-sm text-blush-deep">{error}</p> : null}
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={decline}
            disabled={pending}
            className="text-sm text-muted transition hover:text-ink"
          >
            Decline
          </button>
          <Button onClick={accept} disabled={pending}>
            {pending ? "Joining..." : "Accept invitation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
