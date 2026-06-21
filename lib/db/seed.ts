import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { formatInvoiceNumber } from "@/lib/invoices/numbering";
import {
  computeInvoiceTotals,
  type InvoiceLineInput,
  parseAmountToMinor,
  parseQuantity,
} from "@/lib/money";
import { buildReminderSchedule } from "@/lib/reminders/schedule";
import { newId, newPublicToken } from "./ids";
import { db } from "./index";
import {
  businessProfile,
  client,
  invoice,
  invoiceActivity,
  lineItem,
  payment,
  reminder,
  user,
} from "./schema";

// All seeded data hangs off this one demo user; re-seeding deletes it first (the
// cascade clears everything below it) so `pnpm db:seed` is repeatable. The account
// is created through Better Auth so you can actually log in and see the data.
const DEMO_EMAIL = "demo@payline.test";
const DEMO_PASSWORD = "password1234";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type LineSpec = { description: string; qty: string; unit: string };

function buildLines(currency: string, specs: LineSpec[]) {
  const inputs: InvoiceLineInput[] = specs.map((s) => ({
    quantity: parseQuantity(s.qty),
    unitAmount: parseAmountToMinor(s.unit, currency),
  }));
  return { inputs, specs };
}

async function main() {
  console.log("Seeding demo data...");

  await db.delete(user).where(eq(user.email, DEMO_EMAIL));

  // Sign up through Better Auth: creates the user + password account and fires the
  // databaseHook that seeds a default business profile.
  const signedUp = await auth.api.signUpEmail({
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: "Robin Vale" },
  });
  const userId = signedUp.user.id;

  await db
    .update(businessProfile)
    .set({
      businessName: "Vale Studio",
      address: "21 Maple Row\nPortland, OR 97201",
      brandColor: "#7c3aed",
      invoiceFooter: "Thank you for your business. Payment is due within 14 days.",
      defaultCurrency: "USD",
      defaultTaxRateBps: 0,
      paymentTermsDays: 14,
      invoiceNumberPrefix: "INV-",
      nextClientSeq: 1004,
      reminderOffsetDays: [-3, 0, 3],
    })
    .where(eq(businessProfile.userId, userId));

  const clients = [
    {
      id: newId("client"),
      name: "Atlas Studio",
      email: "ap@atlas.example",
      company: "Atlas Studio",
    },
    { id: newId("client"), name: "Maren Cole", email: "maren@example.com", company: null },
    {
      id: newId("client"),
      name: "Foxglove Co.",
      email: "billing@foxglove.example",
      company: "Foxglove Co.",
    },
  ] as const;

  await db.insert(client).values(
    clients.map((c, i) => ({
      id: c.id,
      userId,
      customerNumber: 1001 + i,
      name: c.name,
      email: c.email,
      company: c.company,
      notes: "Seeded demo client.",
    })),
  );

  const customerNumberOf = (id: string) => 1001 + clients.findIndex((c) => c.id === id);
  const clientSeq: Record<string, number> = {};

  // One spec per invoice state.
  type InvoiceSpec = {
    seq: number;
    clientId: string;
    currency: string;
    taxBps: number;
    discount: string;
    lines: LineSpec[];
    state: "draft" | "sent" | "viewed" | "paid" | "overdue" | "void";
  };

  const specs: InvoiceSpec[] = [
    {
      seq: 1,
      clientId: clients[0].id,
      currency: "USD",
      taxBps: 0,
      discount: "0",
      state: "draft",
      lines: [
        { description: "Brand discovery workshop", qty: "1", unit: "1200.00" },
        { description: "Logo concepts", qty: "3", unit: "350.00" },
      ],
    },
    {
      seq: 2,
      clientId: clients[1].id,
      currency: "USD",
      taxBps: 825,
      discount: "0",
      state: "sent",
      lines: [{ description: "Landing page design", qty: "1", unit: "2980.00" }],
    },
    {
      seq: 3,
      clientId: clients[2].id,
      currency: "USD",
      taxBps: 0,
      discount: "100.00",
      state: "viewed",
      lines: [
        { description: "Consulting", qty: "8", unit: "150.00" },
        { description: "Revisions", qty: "2.5", unit: "150.00" },
      ],
    },
    {
      seq: 4,
      clientId: clients[0].id,
      currency: "USD",
      taxBps: 0,
      discount: "0",
      state: "paid",
      lines: [{ description: "Website build, phase 1", qty: "1", unit: "1200.00" }],
    },
    {
      seq: 5,
      clientId: clients[1].id,
      currency: "EUR",
      taxBps: 2000,
      discount: "0",
      state: "overdue",
      lines: [{ description: "Illustration set", qty: "1", unit: "640.00" }],
    },
    {
      seq: 6,
      clientId: clients[2].id,
      currency: "USD",
      taxBps: 0,
      discount: "0",
      state: "void",
      lines: [{ description: "Cancelled scope", qty: "1", unit: "500.00" }],
    },
  ];

  for (const spec of specs) {
    const { inputs } = buildLines(spec.currency, spec.lines);
    const discount = parseAmountToMinor(spec.discount, spec.currency);
    const totals = computeInvoiceTotals({
      lines: inputs,
      discount,
      taxRateBps: spec.taxBps,
    });

    const invoiceId = newId("invoice");
    const invSeq = (clientSeq[spec.clientId] ?? 0) + 1;
    clientSeq[spec.clientId] = invSeq;
    const issue = daysFromNow(spec.state === "overdue" ? -30 : spec.state === "draft" ? 0 : -7);
    const due = daysFromNow(spec.state === "overdue" ? -16 : spec.state === "draft" ? 14 : 7);

    const storedStatus = spec.state === "overdue" ? "sent" : spec.state;
    const sentAt = spec.state === "draft" ? null : daysFromNow(spec.state === "overdue" ? -30 : -7);
    const viewedAt = spec.state === "viewed" ? daysFromNow(-5) : null;
    const paidAt = spec.state === "paid" ? daysFromNow(-2) : null;

    await db.insert(invoice).values({
      id: invoiceId,
      userId,
      clientId: spec.clientId,
      number: formatInvoiceNumber(customerNumberOf(spec.clientId), isoDate(issue), invSeq),
      currency: spec.currency,
      status: storedStatus,
      issueDate: isoDate(issue),
      dueDate: isoDate(due),
      notes: "Seeded demo invoice.",
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRateBps: spec.taxBps,
      taxTotal: totals.taxTotal,
      total: totals.total,
      publicToken: newPublicToken(),
      sentAt,
      viewedAt,
      paidAt,
    });

    await db.insert(lineItem).values(
      spec.lines.map((l, i) => ({
        id: newId("lineItem"),
        invoiceId,
        description: l.description,
        quantity: inputs[i]?.quantity ?? 0,
        unitAmount: inputs[i]?.unitAmount ?? 0,
        amount: totals.lineAmounts[i] ?? 0,
        position: i,
      })),
    );

    // Activity log per state.
    const activities: {
      kind: typeof invoiceActivity.$inferInsert.kind;
      actor: typeof invoiceActivity.$inferInsert.actor;
      at: Date;
    }[] = [{ kind: "created", actor: "user", at: issue }];
    if (sentAt) activities.push({ kind: "sent", actor: "user", at: sentAt });
    if (viewedAt) activities.push({ kind: "viewed", actor: "client", at: viewedAt });
    if (paidAt) activities.push({ kind: "paid", actor: "system", at: paidAt });
    if (spec.state === "overdue" && sentAt)
      activities.push({ kind: "reminder_sent", actor: "system", at: daysFromNow(-13) });
    if (spec.state === "void")
      activities.push({ kind: "voided", actor: "user", at: daysFromNow(-3) });

    await db
      .insert(invoiceActivity)
      .values(activities.map((a) => ({ id: newId("activity"), invoiceId, ...a })));

    // Payment row for the paid invoice.
    if (spec.state === "paid" && paidAt) {
      await db.insert(payment).values({
        id: newId("payment"),
        invoiceId,
        stripeCheckoutSessionId: `cs_test_seed_${spec.seq}`,
        stripePaymentIntentId: `pi_test_seed_${spec.seq}`,
        amount: totals.total,
        currency: spec.currency,
        status: "succeeded",
        paidAt,
      });
    }

    // Reminders for sent/viewed/overdue invoices.
    if (sentAt && spec.state !== "void") {
      const scheduled = buildReminderSchedule(due, [-3, 0, 3], sentAt, { includePast: true });
      await db.insert(reminder).values(
        scheduled.map((r) => {
          const passed = r.scheduledFor.getTime() < Date.now();
          // Paid invoices cancel pending reminders; overdue ones have past slots sent.
          const state = spec.state === "paid" ? "canceled" : passed ? "sent" : "pending";
          return {
            id: newId("reminder"),
            invoiceId,
            kind: r.kind,
            scheduledFor: r.scheduledFor,
            state: state as typeof reminder.$inferInsert.state,
            sentAt: state === "sent" ? r.scheduledFor : null,
          };
        }),
      );
    }
  }

  for (const [clientId, used] of Object.entries(clientSeq)) {
    await db
      .update(client)
      .set({ nextInvoiceSeq: used + 1 })
      .where(eq(client.id, clientId));
  }

  console.log(
    "Seeded 1 freelancer, 3 clients, 6 invoices (draft, sent, viewed, paid, overdue, void).",
  );
  console.log(`Demo login:  ${DEMO_EMAIL}  /  ${DEMO_PASSWORD}`);
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
