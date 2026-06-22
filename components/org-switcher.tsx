"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState, useTransition } from "react";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/cn";

export type Team = { id: string; name: string };

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  // Suffix keeps slugs unique across teams with the same name.
  return `${base || "team"}-${Math.random().toString(36).slice(2, 7)}`;
}

export function OrgSwitcher({
  teams,
  activeTeamId,
  logo,
}: {
  teams: Team[];
  activeTeamId: string;
  logo: ReactNode;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const active = teams.find((t) => t.id === activeTeamId);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  function switchTo(id: string) {
    setOpen(false);
    if (id === activeTeamId) return;
    start(async () => {
      await authClient.organization.setActive({ organizationId: id });
      router.push("/dashboard");
      router.refresh();
    });
  }

  function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    start(async () => {
      const res = await authClient.organization.create({ name: trimmed, slug: slugify(trimmed) });
      if (res.error || !res.data) {
        setError("Couldn't create the team. Try again.");
        return;
      }
      await authClient.organization.setActive({ organizationId: res.data.id });
      setOpen(false);
      setCreating(false);
      setName("");
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch team"
        className="flex w-full items-center gap-2 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-line/50"
      >
        {logo}
        <span className="min-w-0 flex-1 truncate text-left font-semibold tracking-tight">
          {active?.name ?? "Payline"}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-faint" strokeWidth={1.6} />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-60 rounded-2xl border border-line bg-card p-1.5 shadow-xl">
          <p className="px-2.5 pb-1.5 pt-1 font-geist text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
            Teams
          </p>
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTo(t.id)}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors hover:bg-line/60"
            >
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
              {t.id === activeTeamId ? (
                <Check className="size-4 shrink-0 text-ink" strokeWidth={1.6} />
              ) : null}
            </button>
          ))}

          <div className="my-1 h-px bg-line" />

          {creating ? (
            <div className="p-1.5">
              <input
                // biome-ignore lint/a11y/noAutofocus: focus the field the user just opened
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") create();
                  if (e.key === "Escape") setCreating(false);
                }}
                placeholder="Team name"
                maxLength={60}
                className="w-full rounded-xl border border-line bg-canvas px-3 py-1.5 text-sm outline-none focus:border-ink"
              />
              {error ? <p className="mt-1 px-1 text-xs text-blush-deep">{error}</p> : null}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-lg px-2.5 py-1 text-sm text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={create}
                  disabled={pending || !name.trim()}
                  className="rounded-lg bg-ink px-2.5 py-1 text-sm font-medium text-white disabled:opacity-50"
                >
                  {pending ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-muted transition-colors hover:bg-line/60 hover:text-ink",
              )}
            >
              <Plus className="size-4 shrink-0" strokeWidth={1.6} />
              Create team
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
