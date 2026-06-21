"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-line bg-card/60 px-6 py-20 text-center">
      <p className="font-serif text-xl italic text-ink">Something went sideways.</p>
      <p className="max-w-sm text-sm text-muted">
        That page didn't load. It's usually a hiccup, not your data.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
