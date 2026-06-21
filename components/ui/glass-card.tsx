import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tint = "plain" | "blush" | "sage" | "peri";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  tint?: Tint;
  /** Adds hover-lift; use ONLY when the whole card is clickable. */
  interactive?: boolean;
};

const tints: Record<Tint, string> = {
  plain: "glass",
  blush: "glass-blush",
  sage: "glass-sage",
  peri: "glass-peri",
};

export function GlassCard({
  tint = "plain",
  interactive = false,
  className,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6",
        tints[tint],
        interactive && "hover-lift cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}
