import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="inline-flex items-center gap-2">
        <Logo size={22} withWordmark />
      </Link>
      <div className="mt-10">{children}</div>
      <Link
        href="/"
        className="mt-12 inline-block text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        Back home
      </Link>
    </div>
  );
}
