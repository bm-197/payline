"use client";

import { useEffect, useRef, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { cn } from "@/lib/cn";

export function ColorPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Pick a custom accent color"
        className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted transition hover:text-ink"
      >
        <span className="size-8 rounded-full ring-1 ring-line" style={{ backgroundColor: value }} />
        Custom
      </button>

      {open ? (
        <div className="pl-colorpicker absolute left-0 top-full z-40 mt-2 w-60 rounded-3xl border border-line bg-card p-4 shadow-xl">
          <HexColorPicker color={value} onChange={onChange} />
          <div className="mt-3 flex items-center gap-2">
            <span
              className="size-7 shrink-0 rounded-lg ring-1 ring-line"
              style={{ backgroundColor: value }}
            />
            <HexColorInput
              color={value}
              onChange={onChange}
              prefixed
              className="w-full rounded-xl border border-line bg-card px-3 py-1.5 font-geist text-sm uppercase outline-none transition-colors focus:border-ink"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
