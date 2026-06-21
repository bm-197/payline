"use client";

import { type ReactNode, useRef } from "react";

/**
 * Wraps a table and adds roving keyboard navigation over its row links (marked
 * with data-row-link). Arrow up/down move focus; Home/End jump; Enter follows the
 * link natively. Keeps the table itself server-rendered.
 */
export function TableKeyboardNav({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const links = Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-row-link]") ?? []);
    if (links.length === 0) return;
    e.preventDefault();

    const idx = links.indexOf(document.activeElement as HTMLElement);
    let next = idx;
    if (e.key === "ArrowDown") next = idx < 0 ? 0 : Math.min(idx + 1, links.length - 1);
    else if (e.key === "ArrowUp") next = idx < 0 ? links.length - 1 : Math.max(idx - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = links.length - 1;

    links[next]?.focus();
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: keyboard-nav container delegating to row links
    <div ref={ref} onKeyDown={onKeyDown} role="presentation">
      {children}
    </div>
  );
}
