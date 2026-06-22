import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { InvoiceTheme } from "@/lib/invoices/theme";
import { newId, newPublicToken } from "./ids";

// Money is always stored as integer minor units in bigint columns (int4 maxes at
// ~$21M, too small). Quantities are integers scaled by 1000; tax rates are basis
// points. See lib/money.

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

const money = (name: string) => bigint(name, { mode: "number" });

export const invoiceStatus = pgEnum("invoice_status", ["draft", "sent", "viewed", "paid", "void"]);

export const reminderKind = pgEnum("reminder_kind", ["before_due", "on_due", "after_due"]);

export const reminderState = pgEnum("reminder_state", ["pending", "sent", "skipped", "canceled"]);

export const paymentStatus = pgEnum("payment_status", ["pending", "succeeded", "failed"]);

export const activityKind = pgEnum("activity_kind", [
  "created",
  "sent",
  "viewed",
  "paid",
  "reminder_sent",
  "voided",
]);

export const activityActor = pgEnum("activity_actor", ["user", "client", "system"]);

// Better Auth core tables (user/session/account/verification). Column shapes match
// Better Auth's defaults so its Drizzle adapter maps cleanly. user is also the
// ownership anchor for all domain data.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  ...timestamps,
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // The team the user is currently working in (Better Auth organization plugin).
  activeOrganizationId: text("active_organization_id"),
  ...timestamps,
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

// Better Auth organization plugin tables. A "team" (our domain word) is an
// organization here. Column shapes match the plugin's defaults; teams sub-feature is
// NOT enabled (no team table). See docs/adr/0002.
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("member_org_idx").on(t.organizationId), index("member_user_idx").on(t.userId)],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("invitation_org_idx").on(t.organizationId)],
);

export const businessProfile = pgTable("business_profile", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => newId("business")),
  // Creator/audit only; a user can own several teams, so this is no longer unique.
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // The owning team. One business profile per team.
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  logoUrl: text("logo_url"),
  address: text("address"),
  brandColor: text("brand_color"),
  invoiceFooter: text("invoice_footer"),
  theme: jsonb("theme").$type<InvoiceTheme>(),
  defaultCurrency: text("default_currency").notNull().default("USD"),
  defaultTaxRateBps: integer("default_tax_rate_bps").notNull().default(0),
  paymentTermsDays: integer("payment_terms_days").notNull().default(14),
  invoiceNumberPrefix: text("invoice_number_prefix").notNull().default("INV-"),
  nextInvoiceSeq: integer("next_invoice_seq").notNull().default(1),
  nextClientSeq: integer("next_client_seq").notNull().default(1001),
  // Days relative to due date when reminders fire. Negative = before due.
  reminderOffsetDays: jsonb("reminder_offset_days").$type<number[]>().notNull().default([-3, 0, 3]),
  // Stripe Connect (Express): the freelancer's connected account and whether it can
  // accept charges yet (set from the account.updated webhook).
  stripeAccountId: text("stripe_account_id"),
  stripeChargesEnabled: boolean("stripe_charges_enabled").notNull().default(false),
  ...timestamps,
});

export const client = pgTable(
  "client",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("client")),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    company: text("company"),
    address: text("address"),
    notes: text("notes"),
    clientNumber: integer("client_number"),
    nextInvoiceSeq: integer("next_invoice_seq").notNull().default(1),
    ...timestamps,
  },
  (t) => [index("client_org_idx").on(t.organizationId)],
);

export const invoice = pgTable(
  "invoice",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("invoice")),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "restrict" }),
    number: text("number").notNull(),
    currency: text("currency").notNull(),
    status: invoiceStatus("status").notNull().default("draft"),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    notes: text("notes"),
    // Frozen at send time so an already-sent invoice never restyles when the
    // business theme changes. Null (drafts) falls back to the live business theme.
    theme: jsonb("theme").$type<InvoiceTheme>(),
    subtotal: money("subtotal").notNull().default(0),
    discount: money("discount").notNull().default(0),
    taxRateBps: integer("tax_rate_bps").notNull().default(0),
    taxTotal: money("tax_total").notNull().default(0),
    total: money("total").notNull().default(0),
    publicToken: text("public_token")
      .notNull()
      .unique()
      .$defaultFn(() => newPublicToken()),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("invoice_org_idx").on(t.organizationId),
    index("invoice_client_idx").on(t.clientId),
    uniqueIndex("invoice_org_number_idx").on(t.organizationId, t.number),
  ],
);

export const lineItem = pgTable(
  "line_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("lineItem")),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: bigint("quantity", { mode: "number" }).notNull(),
    unitAmount: money("unit_amount").notNull(),
    amount: money("amount").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("line_item_invoice_idx").on(t.invoiceId)],
);

export const payment = pgTable(
  "payment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("payment")),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    amount: money("amount").notNull(),
    currency: text("currency").notNull(),
    status: paymentStatus("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("payment_invoice_idx").on(t.invoiceId),
    uniqueIndex("payment_session_idx").on(t.stripeCheckoutSessionId),
  ],
);

// Webhook idempotency: a Stripe event is recorded here before we act on it.
export const stripeEvent = pgTable("stripe_event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => newId("stripeEvent")),
  eventId: text("event_id").notNull().unique(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reminder = pgTable(
  "reminder",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("reminder")),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    kind: reminderKind("kind").notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    state: reminderState("state").notNull().default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("reminder_invoice_idx").on(t.invoiceId),
    index("reminder_due_idx").on(t.state, t.scheduledFor),
  ],
);

export const invoiceActivity = pgTable(
  "invoice_activity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("activity")),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    kind: activityKind("kind").notNull(),
    actor: activityActor("actor").notNull(),
    at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
  },
  (t) => [index("invoice_activity_invoice_idx").on(t.invoiceId)],
);

export type User = typeof user.$inferSelect;
export type BusinessProfile = typeof businessProfile.$inferSelect;
export type Client = typeof client.$inferSelect;
export type Invoice = typeof invoice.$inferSelect;
export type LineItem = typeof lineItem.$inferSelect;
export type Payment = typeof payment.$inferSelect;
export type Reminder = typeof reminder.$inferSelect;
export type InvoiceActivity = typeof invoiceActivity.$inferSelect;
export type InvoiceStatusValue = (typeof invoiceStatus.enumValues)[number];
