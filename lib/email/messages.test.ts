import { describe, expect, it } from "vitest";
import { buildInvoiceEmail, buildReminderEmail } from "./messages";

const base = {
  businessName: "Vale Studio",
  clientName: "Maren Cole",
  to: "maren@example.com",
  invoiceNumber: "INV-0002",
  total: 322585,
  currency: "USD",
  dueDate: "2026-06-20",
  publicToken: "abc123token",
};

describe("buildInvoiceEmail", () => {
  it("addresses the client and names the business and amount", () => {
    const msg = buildInvoiceEmail(base);
    expect(msg.to).toBe("maren@example.com");
    expect(msg.subject).toContain("INV-0002");
    expect(msg.subject).toContain("Vale Studio");
    expect(msg.text).toContain("Hi Maren Cole,");
    expect(msg.text).toContain("$3,225.85");
    expect(msg.text).toContain("/i/abc123token");
  });

  it("contains no em dashes (house anti-slop rule)", () => {
    const msg = buildInvoiceEmail(base);
    expect(msg.text).not.toContain("—");
    expect(msg.subject).not.toContain("—");
  });
});

describe("buildReminderEmail", () => {
  it("shifts tone by kind", () => {
    expect(buildReminderEmail({ ...base, kind: "before_due" }).text).toContain("due on");
    expect(buildReminderEmail({ ...base, kind: "on_due" }).text).toContain("due today");
    expect(buildReminderEmail({ ...base, kind: "after_due" }).text).toContain("still open");
  });

  it("uses a gentler subject after the due date", () => {
    expect(buildReminderEmail({ ...base, kind: "after_due" }).subject).toContain("gentle nudge");
  });

  it("always links to the hosted invoice and avoids em dashes", () => {
    for (const kind of ["before_due", "on_due", "after_due"] as const) {
      const msg = buildReminderEmail({ ...base, kind });
      expect(msg.text).toContain("/i/abc123token");
      expect(msg.text).not.toContain("—");
    }
  });
});
