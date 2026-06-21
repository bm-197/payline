"use client";

import { ChevronsUpDown, Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { SearchTrigger, SearchTriggerIcon } from "@/components/search-trigger";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/cn";

export type NavLink = { href: string; label: string; icon: ReactNode };

const COOKIE = "payline-sidebar";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function CreateButton({
  showLabels,
  onNavigate,
}: {
  showLabels: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/invoices/new"
      onClick={onNavigate}
      title={showLabels ? undefined : "New invoice"}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-2xl bg-linear-to-b from-zinc-800 to-black font-medium text-white shadow-lg shadow-zinc-900/20 transition outline-offset-2 focus-visible:outline-2 focus-visible:outline-ink motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
        showLabels ? "h-11 self-start pr-4 pl-3 text-sm" : "size-11 justify-center self-center",
      )}
    >
      <Plus className="size-5 shrink-0" strokeWidth={1.6} />
      {showLabels && <span>New invoice</span>}
    </Link>
  );
}

export function Sidebar({
  brand,
  links,
  user,
  initialCollapsed,
  children,
}: {
  brand: { name: string; logo: ReactNode };
  links: NavLink[];
  user: { name: string; sublabel?: string };
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist via cookie (not localStorage) so the server renders the right width
  // with no hydration flash. See DECISIONS.md.
  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      // biome-ignore lint/suspicious/noDocumentCookie: intentional client-side persistence
      document.cookie = `${COOKIE}=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });

  const railBody = (showLabels: boolean, onNavigate?: () => void) => (
    <div className={cn("flex h-full flex-col py-3", showLabels ? "pr-4 pl-6" : "px-6")}>
      <div className="flex">
        <CreateButton showLabels={showLabels} onNavigate={onNavigate} />
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              title={showLabels ? undefined : link.label}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-line/70 font-medium text-ink"
                  : "text-muted hover:bg-line/50 hover:text-ink",
              )}
            >
              <span className="grid size-5 shrink-0 place-items-center">{link.icon}</span>
              {showLabels && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-line pt-3">
        <UserMenu user={user} showLabels={showLabels} onNavigate={onNavigate} />
      </div>
    </div>
  );

  const brandBlock = (
    <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
      {brand.logo}
      <span className="truncate font-semibold tracking-tight">{brand.name}</span>
    </Link>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-30 hidden h-16 items-center bg-canvas pr-4 md:flex">
        <div className="flex h-full w-64 shrink-0 items-center gap-2 pl-6">
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="shrink-0 rounded-lg p-1.5 text-faint transition-colors hover:bg-line/50 hover:text-ink"
          >
            <Menu className="size-5" strokeWidth={1.6} />
          </button>
          {brandBlock}
        </div>
        <SearchTrigger className="w-full max-w-xl" />
      </header>

      <div className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-line bg-card/80 px-4 py-2.5 backdrop-blur-md md:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-muted hover:bg-line/60 hover:text-ink"
        >
          <Menu className="size-5" strokeWidth={1.6} />
        </button>
        {brand.logo}
        <span className="truncate font-semibold tracking-tight">{brand.name}</span>
        <div className="ml-auto">
          <SearchTriggerIcon />
        </div>
      </div>

      <div className="flex flex-1">
        <aside
          className={cn(
            "sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 self-start bg-transparent md:flex md:flex-col",
            "motion-safe:transition-[width] motion-safe:duration-200",
            collapsed ? "w-24" : "w-64",
          )}
        >
          {railBody(!collapsed)}
        </aside>

        <main className="glass min-w-0 flex-1 md:mt-3 md:rounded-tl-3xl">
          <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:px-10 md:pt-10">{children}</div>
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 cursor-default bg-ink/20"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-card shadow-xl">
            <div className="flex items-center gap-2 px-5 pt-4">{brandBlock}</div>
            <div className="min-h-0 flex-1">{railBody(true, () => setMobileOpen(false))}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({
  user,
  showLabels,
  onNavigate,
}: {
  user: { name: string; sublabel?: string };
  showLabels: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const item =
    "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-muted transition-colors hover:bg-line/60 hover:text-ink";

  function handleSignOut() {
    setOpen(false);
    onNavigate?.();
    start(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="relative">
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 cursor-default"
          onClick={() => setOpen(false)}
        />
      )}
      {open && (
        <div className="absolute bottom-full left-0 z-40 mb-2 w-56 rounded-2xl border border-line bg-card p-1.5 shadow-xl">
          <div className="px-2.5 py-1.5">
            <p className="truncate text-sm font-medium">{user.name}</p>
            {user.sublabel && <p className="truncate text-xs text-faint">{user.sublabel}</p>}
          </div>
          <div className="my-1 h-px bg-line" />
          <button type="button" onClick={handleSignOut} className={item}>
            Sign out
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={showLabels ? undefined : user.name}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-line/50",
          !showLabels && "justify-center px-0",
        )}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-line/70 font-geist text-xs font-medium text-ink">
          {initials(user.name)}
        </span>
        {showLabels && (
          <>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{user.name}</span>
              {user.sublabel && (
                <span className="truncate text-xs text-faint">{user.sublabel}</span>
              )}
            </span>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-faint" strokeWidth={1.6} />
          </>
        )}
      </button>
    </div>
  );
}
