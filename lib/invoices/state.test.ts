import { describe, expect, it } from "vitest";
import { formatInvoiceNumber } from "./numbering";
import {
  assertTransition,
  canTransition,
  displayStatus,
  isOverdue,
  isTerminal,
  type StoredStatus,
} from "./state";

describe("formatInvoiceNumber", () => {
  it("combines client number, issue date, and a 3-digit serial", () => {
    expect(formatInvoiceNumber(5030, "2024-02-02", 1)).toBe("5030-20240202-001");
    expect(formatInvoiceNumber(1001, "2026-06-13", 42)).toBe("1001-20260613-042");
  });

  it("does not truncate serials past 999", () => {
    expect(formatInvoiceNumber(1001, "2026-01-01", 1234)).toBe("1001-20260101-1234");
  });

  it("rejects bad inputs", () => {
    expect(() => formatInvoiceNumber(0, "2026-01-01", 1)).toThrow();
    expect(() => formatInvoiceNumber(1001, "2026-01-01", 0)).toThrow();
    expect(() => formatInvoiceNumber(1001, "2026/01/01", 1)).toThrow();
  });
});

describe("invoice transitions", () => {
  const all: StoredStatus[] = ["draft", "sent", "viewed", "paid", "void"];

  it("allows the documented edges", () => {
    expect(canTransition("draft", "sent")).toBe(true);
    expect(canTransition("draft", "void")).toBe(true);
    expect(canTransition("sent", "viewed")).toBe(true);
    expect(canTransition("sent", "paid")).toBe(true);
    expect(canTransition("sent", "void")).toBe(true);
    expect(canTransition("viewed", "paid")).toBe(true);
    expect(canTransition("viewed", "void")).toBe(true);
  });

  it("forbids skipping draft straight to paid", () => {
    expect(canTransition("draft", "paid")).toBe(false);
    expect(canTransition("draft", "viewed")).toBe(false);
  });

  it("treats paid and void as terminal", () => {
    expect(isTerminal("paid")).toBe(true);
    expect(isTerminal("void")).toBe(true);
    for (const to of all) {
      expect(canTransition("paid", to)).toBe(false);
      expect(canTransition("void", to)).toBe(false);
    }
  });

  it("never allows going back to draft", () => {
    for (const from of all) {
      expect(canTransition(from, "draft")).toBe(false);
    }
  });

  it("assertTransition throws on an illegal edge", () => {
    expect(() => assertTransition("paid", "sent")).toThrow(/invalid invoice transition/);
    expect(() => assertTransition("draft", "sent")).not.toThrow();
  });
});

describe("overdue derivation", () => {
  const now = new Date("2026-06-13T12:00:00Z");
  const past = new Date("2026-06-01");
  const future = new Date("2026-07-01");

  it("is overdue when sent/viewed and past due", () => {
    expect(isOverdue("sent", past, now)).toBe(true);
    expect(isOverdue("viewed", past, now)).toBe(true);
  });

  it("is not overdue before the due date", () => {
    expect(isOverdue("sent", future, now)).toBe(false);
  });

  it("is never overdue when draft, paid, or void", () => {
    expect(isOverdue("draft", past, now)).toBe(false);
    expect(isOverdue("paid", past, now)).toBe(false);
    expect(isOverdue("void", past, now)).toBe(false);
  });

  it("display status folds overdue in but leaves terminal states alone", () => {
    expect(displayStatus("sent", past, now)).toBe("overdue");
    expect(displayStatus("sent", future, now)).toBe("sent");
    expect(displayStatus("paid", past, now)).toBe("paid");
  });
});
