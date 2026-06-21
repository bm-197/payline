# Payline

Invoicing for freelancers. Create a branded invoice, send it as a hosted page plus a PDF,
let your client pay by card through a payment link, and let Payline send polite automatic
reminders until it is paid. Get paid without the awkward follow-up.

## Stack

- Next.js (App Router, RSC by default) + TypeScript (strict)
- Postgres + Drizzle ORM (migrations via drizzle-kit)
- Better Auth (email/password)
- Stripe Checkout (payment mode) + signature-verified, idempotent webhooks
- Inngest for durable, scheduled reminders
- `@react-pdf/renderer` for PDFs
- Tailwind CSS v4, Biome (lint + format), Vitest

Money is integer minor units everywhere (never floats); `lib/money` owns all monetary math
with invoice-level round-half-up.

## Quickstart

Requires Node, pnpm, and Docker.

```bash
pnpm install
cp .env.example .env          # then fill in secrets (see below)
docker compose up -d          # Postgres on host port 5433
pnpm db:migrate
pnpm db:seed
pnpm dev                      # http://localhost:3000
```

Seeded demo login: `demo@payline.test` / `password1234` (a freelancer with clients and
invoices in every state).

### Reminders (Inngest) in dev

```bash
pnpm dev:inngest              # Inngest dev server; set INNGEST_DEV in .env
```

### Payments (Stripe) in dev

Put test-mode `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env`, then forward
webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Pay a sent invoice from its public page with test card `4242 4242 4242 4242`.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Next dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` / `pnpm lint:fix` | Biome check / autofix |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit suite (pure, no DB) |
| `pnpm test:integration` | Integration tests (`*.itest.ts`, hit the dev DB) |
| `pnpm db:generate` / `db:migrate` / `db:seed` / `db:studio` | Drizzle workflow |
| `pnpm dev:inngest` | Local Inngest dev server |

## Architecture

```
app/
  (auth)/            login, signup
  (app)/             dashboard, invoices, clients, settings (behind auth)
  i/[token]/         public hosted invoice page + /pdf
  api/auth, api/inngest, api/stripe/webhook
lib/
  money/             integer money core (heavily unit tested)
  db/                Drizzle schema, client, migrations, seed
  auth/              Better Auth config + server helpers
  invoices/          numbering, state machine, queries, actions, checkout
  reminders/         schedule, per-slot processing, state
  email/             Mailer interface (console + stubbed Resend) + composers
  inngest/           client, events, durable reminder function
  stripe/            lazy client + idempotent webhook processing
  pdf/               react-pdf invoice document
```

Data is scoped by `user_id`; mutations are Server Actions validated with Zod.

## Deployment shape

App on Vercel, hosted Postgres, Inngest for reminders, Stripe in test mode for v0.1.

## License

Private.
