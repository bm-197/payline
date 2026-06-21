import Link from "next/link";
import { Footer } from "@/components/footer";
import { StatusChip } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { Logo } from "@/components/ui/logo";
import { MoneyText } from "@/components/ui/money-text";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <Backdrop />
      <SiteHeader />
      <main>
        <Hero />
        <Trust />
        <HowItWorks />
        <Features />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer
        name="Payline"
        tagline={{
          plain: "Invoicing that gets you paid,",
          accent: "without the awkward follow-up.",
        }}
        description="Branded invoices, hosted payment pages, and gentle reminders, built for freelancers."
        meta="Built by Bisrat · bmaru.me"
        groups={[
          {
            heading: "Product",
            links: [
              { label: "How it works", href: "/#how" },
              { label: "Features", href: "/#features" },
              { label: "Pricing", href: "/#pricing" },
            ],
          },
          {
            heading: "Account",
            links: [
              { label: "Get started", href: "/signup" },
              { label: "Sign in", href: "/login" },
            ],
          },
          {
            heading: "Legal",
            links: [
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ],
          },
        ]}
        social={[
          { label: "GitHub", href: "https://github.com/bm-197", icon: "github" },
          { label: "LinkedIn", href: "https://linkedin.com/in/bm197", icon: "linkedin" },
          { label: "X", href: "https://x.com/ibisrat", icon: "x" },
        ]}
        wordmark="Payline"
      />
    </div>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[820px]">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-peri-deep/40 blur-3xl" />
      <div className="absolute -right-24 top-24 h-96 w-96 rounded-full bg-blush-deep/35 blur-3xl" />
      <div className="absolute left-1/3 top-[420px] h-80 w-80 rounded-full bg-sage-deep/25 blur-3xl" />
    </div>
  );
}

const primaryBtn =
  "rounded-xl bg-linear-to-b from-zinc-800 to-black px-5 py-3 text-sm font-medium text-white shadow-xl shadow-zinc-900/20 transition motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]";
const secondaryBtn =
  "rounded-xl border border-line bg-card px-5 py-3 text-sm font-medium text-ink shadow-sm transition hover:bg-canvas";

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/">
          <Logo size={24} withWordmark />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {[
            { label: "How it works", href: "#how" },
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link href="/signup" className={primaryBtn}>
            Start for free
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
      <div>
        <p className="font-geist text-xs uppercase tracking-widest text-faint">
          Invoicing for freelancers
        </p>
        <h1 className="ink-gradient mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.4rem]">
          Get paid without the <span className="font-serif italic">awkward follow-up.</span>
        </h1>
        <p className="mt-5 max-w-md text-lg text-muted">
          Payline turns a few line items into a branded invoice, a hosted page your client pays by
          card, and gentle reminders that do the chasing. So you can get back to the work.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/signup" className={primaryBtn}>
            Bill your first client
          </Link>
          <a href="#how" className={secondaryBtn}>
            See how it works
          </a>
        </div>
        <p className="mt-4 text-sm text-faint">
          No card to start. 1% per paid invoice, nothing else.
        </p>
      </div>
      <HeroVisual />
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-2">
        <StatusChip status="draft" />
        <Arrow />
        <StatusChip status="sent" />
        <Arrow />
        <StatusChip status="paid" />
      </div>
      <GlassCard className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold tracking-tight">Vale Studio</p>
            <p className="text-xs text-faint">Portland, OR</p>
          </div>
          <div className="text-right">
            <p className="font-geist text-sm font-medium">INV-0007</p>
            <div className="mt-1 flex justify-end">
              <StatusChip status="paid" />
            </div>
          </div>
        </div>
        <div className="mt-5 space-y-2 text-sm">
          <LineRow label="Landing page design" value="$2,400.00" />
          <LineRow label="Two rounds of revisions" value="$600.00" />
        </div>
        <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
          <SmallRow label="Subtotal" value="$3,000.00" muted />
          <SmallRow label="Tax (8.25%)" value="$247.50" muted />
          <div className="flex items-center justify-between pt-1">
            <span className="font-medium">Total</span>
            <span className="text-base font-semibold">
              <MoneyText>$3,247.50</MoneyText>
            </span>
          </div>
        </div>
        <div className="mt-5 rounded-xl bg-linear-to-b from-zinc-800 to-black px-4 py-2.5 text-center text-sm font-medium text-white">
          Paid by card
        </div>
      </GlassCard>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 text-faint"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Trust() {
  const items = [
    {
      k: "Correct to the cent",
      v: "Integer money math. Multi-currency, tax, and discounts that always add up.",
    },
    { k: "Paid in two clicks", v: "Clients pay by card from a link. No account, no friction." },
    {
      k: "Reminders that stop",
      v: "Polite nudges before and after the due date, never once it's paid.",
    },
  ];
  return (
    <section className="border-y border-line bg-card/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3">
        {items.map((i) => (
          <div key={i.k}>
            <p className="font-medium">{i.k}</p>
            <p className="mt-1 text-sm text-muted">{i.v}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Add your client",
      b: "Name, email, company. Once, then reuse them on every invoice.",
    },
    {
      n: "02",
      t: "Build the invoice",
      b: "Line items with live totals, per-invoice tax and discount, any currency.",
    },
    {
      n: "03",
      t: "Send it",
      b: "Your client gets a branded hosted page and a matching PDF by email.",
    },
    {
      n: "04",
      t: "Get paid",
      b: "They pay by card, the invoice flips to paid, and reminders stop on their own.",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
      <SectionHeading
        eyebrow="How it works"
        title="From blank page to paid"
        accent="in four steps."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="rounded-3xl border border-line bg-card p-6">
            <p className="font-geist text-sm font-medium text-faint">{s.n}</p>
            <p className="mt-3 font-medium">{s.t}</p>
            <p className="mt-1.5 text-sm text-muted">{s.b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-line bg-card/40">
      <div className="mx-auto max-w-6xl space-y-20 px-6 py-20">
        <SectionHeading
          eyebrow="Features"
          title="Everything between the work"
          accent="and the money."
        />

        <FeatureRow
          tint="peri"
          title="A page your client actually wants to open."
          body="The hosted invoice is the most beautiful thing in the app for a reason. Branded header, clean line items, a prominent Pay button, and a calm paid state. It looks great on a phone, and downloads as a matching PDF."
          bullets={[
            "Tokenized link, no client login",
            "PDF matches the page exactly",
            "Opening it marks the invoice viewed",
          ]}
          visual={<HostedPageMock />}
        />

        <FeatureRow
          reverse
          tint="sage"
          title="Money math you can trust."
          body="Every amount is an integer in the currency's smallest unit, never a float. Tax and discounts round once at the invoice level, the same way Stripe and the pros do it. The totals are correct to the cent, every time."
          bullets={[
            "Multi-currency per invoice",
            "Per-invoice tax and discount",
            "Sequential invoice numbers",
          ]}
          visual={<TotalsMock />}
        />

        <FeatureRow
          tint="blush"
          title="Reminders that know when to stop."
          body="Schedule polite nudges before and after the due date. They send themselves, they never double up, and the moment an invoice is paid or voided they go quiet. No more chasing, no more awkward emails."
          bullets={[
            "Configurable schedule",
            "Exactly one per slot, never twice",
            "Silent the instant it's paid",
          ]}
          visual={<ReminderTimeline />}
        />
      </div>
    </section>
  );
}

function FeatureRow({
  title,
  body,
  bullets,
  visual,
  tint,
  reverse,
}: {
  title: string;
  body: string;
  bullets: string[];
  visual: React.ReactNode;
  tint: "peri" | "sage" | "blush";
  reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div className={reverse ? "lg:order-2" : undefined}>
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 text-muted">{body}</p>
        <ul className="mt-5 space-y-2 text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2.5">
              <Check />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <GlassCard tint={tint} className={reverse ? "lg:order-1" : undefined}>
        {visual}
      </GlassCard>
    </div>
  );
}

function HostedPageMock() {
  return (
    <div className="rounded-2xl bg-card/80 p-5">
      <div className="flex items-center justify-between">
        <span className="font-medium">Vale Studio</span>
        <StatusChip status="paid" />
      </div>
      <div className="mt-4 space-y-2 text-sm text-muted">
        <div className="flex justify-between">
          <span>Consulting, 8 hrs</span>
          <MoneyText>$1,200.00</MoneyText>
        </div>
        <div className="flex justify-between">
          <span>Revisions</span>
          <MoneyText>$375.00</MoneyText>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="text-sm font-medium">Total due</span>
        <span className="font-semibold">
          <MoneyText>$1,575.00</MoneyText>
        </span>
      </div>
      <div className="mt-4 rounded-xl bg-linear-to-b from-zinc-800 to-black px-4 py-2.5 text-center text-sm font-medium text-white">
        Pay $1,575.00
      </div>
    </div>
  );
}

function TotalsMock() {
  return (
    <div className="rounded-2xl bg-card/80 p-5 text-sm">
      <div className="space-y-2">
        <SmallRow label="3 × $19.99" value="$59.97" muted />
        <SmallRow label="1.5 hrs × $80.00" value="$120.00" muted />
        <div className="my-1 h-px bg-line" />
        <SmallRow label="Subtotal" value="$179.97" muted />
        <SmallRow label="Discount" value="-$20.00" muted />
        <SmallRow label="Tax (7.5%)" value="$12.00" muted />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="font-medium">Total</span>
        <span className="text-base font-semibold">
          <MoneyText>$171.97</MoneyText>
        </span>
      </div>
      <p className="mt-3 text-xs text-faint">Rounded once, at the invoice level. To the cent.</p>
    </div>
  );
}

function ReminderTimeline() {
  const slots = [
    { t: "3 days before", tone: "text-muted" },
    { t: "On the due date", tone: "text-muted" },
    { t: "3 days after", tone: "text-faint" },
  ];
  return (
    <div className="rounded-2xl bg-card/80 p-5">
      <ol className="relative space-y-4 pl-5">
        <span className="absolute left-[3px] top-1.5 bottom-6 w-px bg-line" aria-hidden />
        {slots.map((s) => (
          <li key={s.t} className="relative text-sm">
            <span
              className="absolute -left-5 top-1.5 size-2 rounded-full bg-peri-deep"
              aria-hidden
            />
            <span className={s.tone}>{s.t}</span>
          </li>
        ))}
        <li className="relative text-sm">
          <span className="absolute -left-5 top-1.5 size-2 rounded-full bg-sage-deep" aria-hidden />
          <span className="font-medium">Paid. Reminders stop.</span>
        </li>
      </ol>
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
      <SectionHeading eyebrow="Pricing" title="Simple, and only when you" accent="get paid." />
      <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-muted">
            No monthly fee, no per-seat pricing, no setup cost. Payline takes a flat 1% when an
            invoice is actually paid. If you don't get paid, you don't pay.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {[
              "Unlimited clients and invoices",
              "Hosted invoice pages and PDFs",
              "Card payments straight to your bank",
              "Automatic reminders",
            ].map((b) => (
              <li key={b} className="flex items-center gap-2.5">
                <Check />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-butter p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          <p className="text-sm text-ink/70">Pay as you get paid</p>
          <p className="mt-2 text-5xl font-semibold tracking-tight">1%</p>
          <p className="mt-1 text-sm text-ink/70">per paid invoice. Free to start.</p>
          <Link
            href="/signup"
            className="mt-6 block rounded-xl bg-ink px-5 py-3 text-center text-sm font-medium text-white transition motion-safe:hover:scale-[1.01]"
          >
            Create your account
          </Link>
          <p className="mt-3 text-center text-xs text-ink/60">
            Stripe fees apply, as with any processor.
          </p>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const qs = [
    {
      q: "Do my clients need an account?",
      a: "No. They open a private link, see the invoice, and pay by card. Nothing to sign up for.",
    },
    {
      q: "How do I get my money?",
      a: "You connect your own Stripe account once. Payments land in your balance and Stripe pays out to your bank automatically. Payline keeps a 1% fee.",
    },
    {
      q: "Can I bill in different currencies or add tax?",
      a: "Yes. Currency, tax rate, and discount are set per invoice, and the totals stay correct to the cent.",
    },
    {
      q: "What happens after I send an invoice?",
      a: "Your client gets a branded page and a PDF. Payline tracks when they open it, sends the reminders you scheduled, and stops the moment it's paid.",
    },
  ];
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line bg-card/40">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <SectionHeading eyebrow="FAQ" title="The questions freelancers" accent="actually ask." />
        <div className="mt-10 divide-y divide-line">
          {qs.map((item) => (
            <div key={item.q} className="py-5">
              <p className="font-medium">{item.q}</p>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <GlassCard className="flex flex-col items-center gap-5 px-6 py-14 text-center">
        <h2 className="ink-gradient text-3xl font-semibold tracking-tight sm:text-4xl">
          Bill your first client <span className="font-serif italic">today.</span>
        </h2>
        <p className="max-w-md text-muted">
          Set up your business in a couple of minutes and send an invoice that gets paid.
        </p>
        <Link href="/signup" className={primaryBtn}>
          Start for free
        </Link>
      </GlassCard>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  accent,
}: {
  eyebrow: string;
  title: string;
  accent: string;
}) {
  return (
    <div className="max-w-xl">
      <p className="font-geist text-xs uppercase tracking-widest text-faint">{eyebrow}</p>
      <h2 className="ink-gradient mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title} <span className="font-serif italic">{accent}</span>
      </h2>
    </div>
  );
}

function Check() {
  return (
    <span className="grid size-4 shrink-0 place-items-center rounded-full bg-sage text-sage-deep">
      <svg
        viewBox="0 0 24 24"
        className="size-3"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path d="M5 13l4 4L19 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function LineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <MoneyText>{value}</MoneyText>
    </div>
  );
}

function SmallRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted" : undefined}>{label}</span>
      <MoneyText className={muted ? "text-muted" : undefined}>{value}</MoneyText>
    </div>
  );
}
