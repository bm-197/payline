import { cn } from "@/lib/cn";

/**
 * Renders a preformatted money string in Geist with tabular figures so columns
 * of amounts align. Formatting from minor units lives in lib/money (M1); this is
 * purely presentational and never does math.
 */
export function MoneyText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("font-geist tabular-nums tracking-tight", className)}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {children}
    </span>
  );
}
