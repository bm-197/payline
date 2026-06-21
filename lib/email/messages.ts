import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { ReminderKind } from "@/lib/reminders/schedule";
import type { EmailMessage } from "./types";

export type ReminderEmailInput = {
  kind: ReminderKind;
  businessName: string;
  clientName: string;
  to: string;
  invoiceNumber: string;
  total: number;
  currency: string;
  dueDate: string;
  publicToken: string;
};

function publicUrl(token: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/i/${token}`;
}

export type InvoiceEmailInput = {
  businessName: string;
  clientName: string;
  to: string;
  invoiceNumber: string;
  total: number;
  currency: string;
  dueDate: string;
  publicToken: string;
};

/** The email sent when a freelancer sends an invoice. */
export function buildInvoiceEmail(input: InvoiceEmailInput): EmailMessage {
  const amount = formatMoney(input.total, input.currency);
  const due = formatDate(input.dueDate);
  const link = publicUrl(input.publicToken);

  const text = [
    `Hi ${input.clientName},`,
    "",
    `${input.businessName} sent you invoice ${input.invoiceNumber} for ${amount}, due ${due}.`,
    "",
    `You can view and pay it here: ${link}`,
    "",
    "Thank you,",
    input.businessName,
  ].join("\n");

  return {
    to: input.to,
    subject: `Invoice ${input.invoiceNumber} from ${input.businessName}`,
    text,
  };
}

/** Calm, human reminder copy. Tone shifts with how close to (or past) the due date. */
export function buildReminderEmail(input: ReminderEmailInput): EmailMessage {
  const amount = formatMoney(input.total, input.currency);
  const due = formatDate(input.dueDate);
  const link = publicUrl(input.publicToken);

  const lead =
    input.kind === "before_due"
      ? `Just a friendly heads up: invoice ${input.invoiceNumber} for ${amount} is due on ${due}.`
      : input.kind === "on_due"
        ? `Invoice ${input.invoiceNumber} for ${amount} is due today.`
        : `Invoice ${input.invoiceNumber} for ${amount} was due on ${due} and is still open.`;

  const subject =
    input.kind === "after_due"
      ? `A gentle nudge on invoice ${input.invoiceNumber}`
      : `Invoice ${input.invoiceNumber} from ${input.businessName}`;

  const text = [
    `Hi ${input.clientName},`,
    "",
    lead,
    "",
    `You can view and pay it here: ${link}`,
    "",
    `Thank you,`,
    input.businessName,
  ].join("\n");

  return { to: input.to, subject, text };
}
