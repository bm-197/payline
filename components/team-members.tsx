"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { authClient } from "@/lib/auth/client";

export type MemberRow = { id: string; role: string; name: string; email: string };
export type InviteRow = { id: string; email: string; role: string };

const ASSIGNABLE = ["member", "admin", "viewer"] as const;

export function TeamMembers({
  members,
  invitations,
  canManage,
  currentUserEmail,
}: {
  members: MemberRow[];
  invitations: InviteRow[];
  canManage: boolean;
  currentUserEmail: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ASSIGNABLE)[number]>("member");
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: unknown }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) {
        setError("That didn't work. Please try again.");
        return;
      }
      router.refresh();
    });
  }

  function invite() {
    const e = email.trim();
    if (!e) return;
    run(async () => {
      const res = await authClient.organization.inviteMember({ email: e, role });
      if (!res.error) setEmail("");
      return res;
    });
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Members</h2>
        <p className="text-sm text-muted">
          People with access to this team's invoices and clients.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 border-b border-line/70 px-4 py-3 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {m.name || m.email}
                {m.email === currentUserEmail ? <span className="text-faint"> (you)</span> : null}
              </p>
              <p className="truncate text-xs text-faint">{m.email}</p>
            </div>
            {canManage && m.role !== "owner" && m.email !== currentUserEmail ? (
              <>
                <select
                  value={
                    ASSIGNABLE.includes(m.role as (typeof ASSIGNABLE)[number]) ? m.role : "member"
                  }
                  onChange={(e) =>
                    run(() =>
                      authClient.organization.updateMemberRole({
                        memberId: m.id,
                        role: e.target.value as (typeof ASSIGNABLE)[number],
                      }),
                    )
                  }
                  disabled={pending}
                  className="rounded-lg border border-line bg-canvas px-2 py-1 text-sm capitalize outline-none"
                >
                  {ASSIGNABLE.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    run(() => authClient.organization.removeMember({ memberIdOrEmail: m.id }))
                  }
                  disabled={pending}
                  className="text-sm text-muted transition hover:text-blush-deep"
                >
                  Remove
                </button>
              </>
            ) : (
              <span className="rounded-full bg-line/60 px-2.5 py-0.5 text-xs font-medium capitalize text-muted">
                {m.role}
              </span>
            )}
          </div>
        ))}
      </div>

      {invitations.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <p className="border-b border-line/70 px-4 py-2 font-geist text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
            Pending invitations
          </p>
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 border-b border-line/70 px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{inv.email}</p>
                <p className="text-xs capitalize text-faint">{inv.role}</p>
              </div>
              {canManage ? (
                <button
                  type="button"
                  onClick={() =>
                    run(() => authClient.organization.cancelInvitation({ invitationId: inv.id }))
                  }
                  disabled={pending}
                  className="text-sm text-muted transition hover:text-blush-deep"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {canManage ? (
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="mb-3 text-sm font-medium">Invite someone</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-[14rem] flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof ASSIGNABLE)[number])}
              className="rounded-xl border border-line bg-canvas px-3 py-2 text-sm capitalize outline-none"
            >
              {ASSIGNABLE.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <Button onClick={invite} disabled={pending || !email.trim()}>
              {pending ? "Sending..." : "Send invite"}
            </Button>
          </div>
          {error ? <p className="mt-2 text-sm text-blush-deep">{error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
