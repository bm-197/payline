"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Command = { label: string; href: string; keywords?: string };

const COMMANDS: Command[] = [
  { label: "Go to Dashboard", href: "/dashboard", keywords: "home overview" },
  { label: "Go to Invoices", href: "/invoices", keywords: "bills" },
  { label: "New invoice", href: "/invoices/new", keywords: "create bill add" },
  {
    label: "Invoice design",
    href: "/invoice-design",
    keywords: "theme brand customize font color appearance",
  },
  { label: "Go to Clients", href: "/clients", keywords: "customers people" },
  { label: "New client", href: "/clients/new", keywords: "create add customer" },
  { label: "Settings", href: "/settings", keywords: "profile reminders tax" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("payline:command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("payline:command", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      inputRef.current?.focus();
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => `${c.label} ${c.keywords ?? ""}`.toLowerCase().includes(q));
  }, [query]);

  if (!open) return null;

  function run(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[active];
      if (target) run(target.href);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[18vh]">
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="glass relative w-full max-w-md overflow-hidden rounded-2xl">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search or jump to..."
          className="w-full border-b border-white/40 bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-faint"
        />
        <ul className="max-h-72 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-faint">Nothing matches.</li>
          ) : (
            results.map((c, i) => (
              <li key={c.href}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(c.href)}
                  className={cn(
                    "flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    i === active ? "bg-ink text-white" : "text-ink hover:bg-line/60",
                  )}
                >
                  {c.label}
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="flex items-center justify-between border-t border-white/40 px-3 py-2 text-xs text-faint">
          <span>Jump to a page or action</span>
          <span className="font-geist">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
