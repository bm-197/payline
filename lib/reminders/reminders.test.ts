import { describe, expect, it } from "vitest";
import { buildReminderSchedule, kindForOffset } from "./schedule";
import { canReminderTransition, decideReminderAction } from "./state";

describe("kindForOffset", () => {
  it("maps sign to kind", () => {
    expect(kindForOffset(-3)).toBe("before_due");
    expect(kindForOffset(0)).toBe("on_due");
    expect(kindForOffset(3)).toBe("after_due");
  });
});

describe("buildReminderSchedule", () => {
  const due = new Date("2026-06-20");
  const sentAt = new Date("2026-06-10T09:00:00Z");

  it("builds one row per offset, sorted, with the right kinds", () => {
    const rows = buildReminderSchedule(due, [-3, 0, 3], sentAt);
    expect(rows.map((r) => r.kind)).toEqual(["before_due", "on_due", "after_due"]);
    expect(rows.map((r) => r.scheduledFor.getDate())).toEqual([17, 20, 23]);
  });

  it("collapses duplicate offsets", () => {
    const rows = buildReminderSchedule(due, [-3, -3, 0], sentAt);
    expect(rows).toHaveLength(2);
  });

  it("drops slots that already passed at send time", () => {
    // Sent 1 day before due: the -3 (before) slot is already in the past.
    const lateSend = new Date("2026-06-19T09:00:00Z");
    const rows = buildReminderSchedule(due, [-3, 0, 3], lateSend);
    expect(rows.map((r) => r.kind)).toEqual(["on_due", "after_due"]);
  });

  it("keeps past slots when asked", () => {
    const lateSend = new Date("2026-06-19T09:00:00Z");
    const rows = buildReminderSchedule(due, [-3, 0, 3], lateSend, { includePast: true });
    expect(rows).toHaveLength(3);
  });
});

describe("decideReminderAction", () => {
  const scheduledFor = new Date("2026-06-17T00:00:00Z");

  it("sends when pending, due, and the invoice is still open", () => {
    expect(
      decideReminderAction({
        reminderState: "pending",
        invoiceStatus: "sent",
        scheduledFor,
        now: new Date("2026-06-17T09:00:00Z"),
      }),
    ).toBe("send");
  });

  it("skips when the invoice is paid or void", () => {
    for (const status of ["paid", "void"] as const) {
      expect(
        decideReminderAction({
          reminderState: "pending",
          invoiceStatus: status,
          scheduledFor,
          now: new Date("2026-06-17T09:00:00Z"),
        }),
      ).toBe("skip");
    }
  });

  it("noops when not yet due", () => {
    expect(
      decideReminderAction({
        reminderState: "pending",
        invoiceStatus: "sent",
        scheduledFor,
        now: new Date("2026-06-16T09:00:00Z"),
      }),
    ).toBe("noop");
  });

  it("noops when the reminder is not pending (idempotency)", () => {
    for (const st of ["sent", "skipped", "canceled"] as const) {
      expect(
        decideReminderAction({
          reminderState: st,
          invoiceStatus: "sent",
          scheduledFor,
          now: new Date("2026-06-17T09:00:00Z"),
        }),
      ).toBe("noop");
    }
  });
});

describe("reminder transitions", () => {
  it("only pending can move, and only to terminal states", () => {
    expect(canReminderTransition("pending", "sent")).toBe(true);
    expect(canReminderTransition("pending", "skipped")).toBe(true);
    expect(canReminderTransition("pending", "canceled")).toBe(true);
    expect(canReminderTransition("sent", "skipped")).toBe(false);
    expect(canReminderTransition("canceled", "sent")).toBe(false);
  });
});
