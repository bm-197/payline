import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo size={28} />
      <p className="font-serif text-xl italic text-ink">This invoice link isn't valid.</p>
      <p className="max-w-sm text-sm text-muted">
        It may have been mistyped, or the invoice was removed. Check with whoever sent it.
      </p>
    </div>
  );
}
