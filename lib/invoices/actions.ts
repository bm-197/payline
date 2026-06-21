"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import {
  businessProfile,
  client,
  invoice,
  invoiceActivity,
  lineItem,
  payment,
} from "@/lib/db/schema";
import { getMailer } from "@/lib/email";
import { buildInvoiceEmail } from "@/lib/email/messages";
import { emitInvoicePaid, emitInvoiceSent, emitInvoiceVoided } from "@/lib/inngest/events";
import { computeInvoiceTotals, parseAmountToMinor, parseQuantity, parseTaxRate } from "@/lib/money";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currency";
import { formatInvoiceNumber } from "./numbering";
import { assertTransition } from "./state";

export type InvoiceFormState = { error?: string };

const draftSchema = z.object({
  clientId: z.string().min(1, "Choose a client."),
  currency: z.enum(SUPPORTED_CURRENCIES),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an issue date."),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a due date."),
  taxRate: z.string().default("0"),
  discount: z.string().default("0"),
  notes: z.string().max(2000).optional().default(""),
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Every line needs a description."),
        quantity: z.string().min(1),
        unitAmount: z.string().min(1),
      }),
    )
    .min(1, "Add at least one line item."),
});

export type InvoiceDraftInput = z.input<typeof draftSchema>;

export async function createDraftInvoiceAction(
  input: InvoiceDraftInput,
): Promise<InvoiceFormState> {
  const user = await requireUser();

  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the invoice." };
  }
  const data = parsed.data;

  const owned = await db.query.client.findFirst({
    where: and(eq(client.id, data.clientId), eq(client.userId, user.id)),
  });
  if (!owned) return { error: "That client doesn't exist." };

  // Parse all money + quantities in the invoice currency.
  let lineInputs: { description: string; quantity: number; unitAmount: number }[];
  let discountMinor: number;
  let taxBps: number;
  try {
    lineInputs = data.lines.map((l) => ({
      description: l.description,
      quantity: parseQuantity(l.quantity),
      unitAmount: parseAmountToMinor(l.unitAmount, data.currency),
    }));
    discountMinor = parseAmountToMinor(data.discount || "0", data.currency);
    taxBps = parseTaxRate(data.taxRate || "0");
  } catch {
    return { error: "Amounts must be valid numbers." };
  }

  const totals = computeInvoiceTotals({
    lines: lineInputs,
    discount: discountMinor,
    taxRateBps: taxBps,
  });

  const invoiceId = await db.transaction(async (tx) => {
    const profile = await tx.query.businessProfile.findFirst({
      where: eq(businessProfile.userId, user.id),
    });
    if (!profile) throw new Error("Missing business profile.");

    const cust = await tx.query.client.findFirst({
      where: and(eq(client.id, data.clientId), eq(client.userId, user.id)),
    });
    if (!cust) throw new Error("Client not found.");

    const customerNumber = cust.customerNumber ?? profile.nextClientSeq;
    if (cust.customerNumber == null) {
      await tx
        .update(businessProfile)
        .set({ nextClientSeq: customerNumber + 1 })
        .where(eq(businessProfile.userId, user.id));
    }
    const seq = cust.nextInvoiceSeq;
    await tx
      .update(client)
      .set({ customerNumber, nextInvoiceSeq: seq + 1 })
      .where(eq(client.id, cust.id));

    const number = formatInvoiceNumber(customerNumber, data.issueDate, seq);

    const id = newId("invoice");
    await tx.insert(invoice).values({
      id,
      userId: user.id,
      clientId: data.clientId,
      number,
      currency: data.currency,
      status: "draft",
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      notes: data.notes || null,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRateBps: taxBps,
      taxTotal: totals.taxTotal,
      total: totals.total,
    });

    await tx.insert(lineItem).values(
      lineInputs.map((l, i) => ({
        id: newId("lineItem"),
        invoiceId: id,
        description: l.description,
        quantity: l.quantity,
        unitAmount: l.unitAmount,
        amount: totals.lineAmounts[i] ?? 0,
        position: i,
      })),
    );

    await tx.insert(invoiceActivity).values({
      id: newId("activity"),
      invoiceId: id,
      kind: "created",
      actor: "user",
    });

    return id;
  });

  revalidatePath("/invoices");
  redirect(`/invoices/${invoiceId}`);
}

export type InvoiceActionState = { error?: string };

async function ownedInvoice(userId: string, id: string) {
  return db.query.invoice.findFirst({
    where: and(eq(invoice.id, id), eq(invoice.userId, userId)),
  });
}

function revalidateInvoice(id: string) {
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/dashboard");
}

/** Send a draft: status -> sent, email the client, kick off durable reminders. */
export async function sendInvoiceAction(id: string): Promise<InvoiceActionState> {
  const user = await requireUser();
  const inv = await ownedInvoice(user.id, id);
  if (!inv) return { error: "Invoice not found." };
  if (inv.status !== "draft") return { error: "This invoice has already been sent." };

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(invoice).set({ status: "sent", sentAt: now }).where(eq(invoice.id, id));
    await tx.insert(invoiceActivity).values({
      id: newId("activity"),
      invoiceId: id,
      kind: "sent",
      actor: "user",
    });
  });

  const cust = await db.query.client.findFirst({ where: eq(client.id, inv.clientId) });
  const profile = await db.query.businessProfile.findFirst({
    where: eq(businessProfile.userId, user.id),
  });
  if (cust?.email) {
    await getMailer().send(
      buildInvoiceEmail({
        businessName: profile?.businessName ?? "Payline",
        clientName: cust.name,
        to: cust.email,
        invoiceNumber: inv.number,
        total: inv.total,
        currency: inv.currency,
        dueDate: inv.dueDate,
        publicToken: inv.publicToken,
      }),
    );
  }

  await emitInvoiceSent(id, user.id);
  revalidateInvoice(id);
  return {};
}

/** Manually mark an invoice paid (e.g. paid by bank transfer). Cancels reminders. */
export async function markPaidAction(id: string): Promise<InvoiceActionState> {
  const user = await requireUser();
  const inv = await ownedInvoice(user.id, id);
  if (!inv) return { error: "Invoice not found." };
  if (inv.status === "paid") return {};
  if (inv.status !== "sent" && inv.status !== "viewed") {
    return { error: "Only a sent invoice can be marked paid." };
  }
  assertTransition(inv.status, "paid");

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(invoice).set({ status: "paid", paidAt: now }).where(eq(invoice.id, id));
    await tx.insert(payment).values({
      id: newId("payment"),
      invoiceId: id,
      amount: inv.total,
      currency: inv.currency,
      status: "succeeded",
      paidAt: now,
    });
    await tx.insert(invoiceActivity).values({
      id: newId("activity"),
      invoiceId: id,
      kind: "paid",
      actor: "user",
      meta: { manual: true },
    });
  });

  await emitInvoicePaid(id);
  revalidateInvoice(id);
  return {};
}

/** Void an invoice (draft/sent/viewed -> void). Cancels reminders. */
export async function voidInvoiceAction(id: string): Promise<InvoiceActionState> {
  const user = await requireUser();
  const inv = await ownedInvoice(user.id, id);
  if (!inv) return { error: "Invoice not found." };
  if (inv.status === "void") return {};
  if (inv.status === "paid") return { error: "A paid invoice can't be voided." };
  assertTransition(inv.status, "void");

  await db.transaction(async (tx) => {
    await tx.update(invoice).set({ status: "void" }).where(eq(invoice.id, id));
    await tx.insert(invoiceActivity).values({
      id: newId("activity"),
      invoiceId: id,
      kind: "voided",
      actor: "user",
    });
  });

  await emitInvoiceVoided(id);
  revalidateInvoice(id);
  return {};
}
