import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-line/70 motion-safe:animate-pulse", className)} />;
}
