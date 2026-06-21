import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-line bg-card/60 px-6 py-20 text-center">
      <p className="font-serif text-xl italic text-ink">We couldn't find that.</p>
      <p className="max-w-sm text-sm text-muted">
        The page may have moved, or the link was mistyped.
      </p>
      <Link href="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
