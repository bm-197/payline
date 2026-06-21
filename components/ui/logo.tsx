import Image from "next/image";
import { cn } from "@/lib/cn";

const RATIO = 492 / 507; // intrinsic logo aspect ratio

/** The Payline product mark. `size` is the rendered height in px. */
export function Logo({
  size = 28,
  withWordmark = false,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="Payline"
        width={Math.round(size * RATIO)}
        height={size}
        priority
      />
      {withWordmark ? (
        <span className="text-lg font-semibold tracking-tight text-ink">Payline</span>
      ) : null}
    </span>
  );
}
