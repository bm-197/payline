"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; silently ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink",
        className,
      )}
    >
      {copied ? "Copied" : (label ?? "Copy")}
      {copied ? (
        <Check className="size-3.5 text-sage-deep" strokeWidth={1.6} aria-hidden />
      ) : (
        <Copy className="size-3.5 text-faint" strokeWidth={1.6} aria-hidden />
      )}
    </button>
  );
}
