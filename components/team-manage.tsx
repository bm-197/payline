"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Team } from "@/components/org-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { authClient } from "@/lib/auth/client";

export function TeamManage({
  teams,
  activeTeamId,
  canManage,
  isOwner,
}: {
  teams: Team[];
  activeTeamId: string;
  canManage: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const active = teams.find((t) => t.id === activeTeamId);
  const others = teams.filter((t) => t.id !== activeTeamId);
  const onlyTeam = others.length === 0;

  const [name, setName] = useState(active?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function rename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === active?.name) return;
    setError(null);
    start(async () => {
      const res = await authClient.organization.update({
        data: { name: trimmed },
        organizationId: activeTeamId,
      });
      if (res.error) {
        setError("Couldn't rename the team.");
        return;
      }
      router.refresh();
    });
  }

  // Leaving or deleting the active team: hand off to another team first so the
  // session always has a valid active team.
  function afterExit() {
    start(async () => {
      const next = others[0];
      if (next) await authClient.organization.setActive({ organizationId: next.id });
      router.push("/dashboard");
      router.refresh();
    });
  }

  function leave() {
    setError(null);
    start(async () => {
      const res = await authClient.organization.leave({ organizationId: activeTeamId });
      if (res.error) {
        setError("Couldn't leave the team. (An owner must hand off ownership first.)");
        return;
      }
      afterExit();
    });
  }

  function remove() {
    setError(null);
    start(async () => {
      const res = await authClient.organization.delete({ organizationId: activeTeamId });
      if (res.error) {
        setError("Couldn't delete the team.");
        return;
      }
      afterExit();
    });
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Team</h2>
        <p className="text-sm text-muted">The workspace you're currently in.</p>
      </div>

      {canManage ? (
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="mb-1.5 text-sm font-medium">Team name</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              className="min-w-[16rem] flex-1"
            />
            <Button
              onClick={rename}
              disabled={pending || !name.trim() || name.trim() === active?.name}
            >
              {pending ? "Saving..." : "Rename"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-line bg-card p-4">
        <p className="text-sm font-medium">{isOwner ? "Delete team" : "Leave team"}</p>
        <p className="mt-1 text-sm text-muted">
          {onlyTeam
            ? "You can't leave or delete your only team. Create another first."
            : isOwner
              ? "Permanently delete this team and all of its invoices and clients."
              : "Remove yourself from this team. You'll switch to another of your teams."}
        </p>
        <div className="mt-3">
          {isOwner ? (
            confirmDelete ? (
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="font-medium text-blush-deep"
                >
                  Delete permanently
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-faint"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={onlyTeam || pending}
                className="text-sm text-blush-deep transition hover:underline disabled:opacity-50"
              >
                Delete this team
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={leave}
              disabled={onlyTeam || pending}
              className="text-sm text-blush-deep transition hover:underline disabled:opacity-50"
            >
              Leave this team
            </button>
          )}
        </div>
      </div>

      {error ? <p className="text-sm text-blush-deep">{error}</p> : null}
    </section>
  );
}
