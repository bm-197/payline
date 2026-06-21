"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

function open() {
  window.dispatchEvent(new Event("payline:command"));
}

export function SearchTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "glass flex h-11 items-center gap-3 rounded-2xl px-4 text-left text-sm text-faint transition-colors hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        className,
      )}
    >
      <Search className="size-[1.2rem] shrink-0" strokeWidth={1.8} />
      <span className="flex-1 truncate">Search or jump to...</span>
      <kbd className="hidden shrink-0 rounded-md border border-line bg-canvas px-1.5 py-0.5 font-geist text-[11px] text-faint sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}

export function SearchTriggerIcon() {
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search"
      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-line/60 hover:text-ink"
    >
      <Search className="size-5" strokeWidth={1.8} />
    </button>
  );
}
