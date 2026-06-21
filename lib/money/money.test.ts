import { describe, expect, it } from "vitest";
import { minorUnitDigits, minorUnitFactor } from "./currency";
import {
  computeInvoiceTotals,
  formatMoney,
  formatQuantity,
  formatTaxRate,
  lineAmount,
  parseAmountToMinor,
  parseQuantity,
  parseTaxRate,
  roundHalfUp,
} from "./money";

describe("minorUnitDigits", () => {
  it("knows common currencies", () => {
    expect(minorUnitDigits("USD")).toBe(2);
    expect(minorUnitDigits("EUR")).toBe(2);
    expect(minorUnitDigits("JPY")).toBe(0);
    expect(minorUnitDigits("BHD")).toBe(3);
  });

  it("is case-insensitive", () => {
    expect(minorUnitDigits("usd")).toBe(2);
  });

  it("falls back to Intl for less common codes", () => {
    expect(minorUnitDigits("SEK")).toBe(2);
  });

  it("throws on a malformed code", () => {
    expect(() => minorUnitDigits("US")).toThrow(/Unknown currency/);
    expect(() => minorUnitDigits("DOLLAR")).toThrow(/Unknown currency/);
  });

  it("exposes the matching factor", () => {
    expect(minorUnitFactor("USD")).toBe(100n);
    expect(minorUnitFactor("JPY")).toBe(1n);
    expect(minorUnitFactor("BHD")).toBe(1000n);
  });
});

describe("roundHalfUp", () => {
  it("rounds halves toward positive infinity", () => {
    expect(roundHalfUp(5n, 10n)).toBe(1n); // 0.5 -> 1
    expect(roundHalfUp(15n, 10n)).toBe(2n); // 1.5 -> 2
    expect(roundHalfUp(25n, 10n)).toBe(3n); // 2.5 -> 3
  });

  it("rounds below the half down", () => {
    expect(roundHalfUp(4n, 10n)).toBe(0n);
    expect(roundHalfUp(14n, 10n)).toBe(1n);
  });

  it("leaves exact divisions alone", () => {
    expect(roundHalfUp(100n, 10n)).toBe(10n);
    expect(roundHalfUp(0n, 10n)).toBe(0n);
  });

  it("rejects a non-positive denominator", () => {
    expect(() => roundHalfUp(1n, 0n)).toThrow();
  });
});

describe("parseAmountToMinor", () => {
  it("parses plain and decimal input", () => {
    expect(parseAmountToMinor("12", "USD")).toBe(1200);
    expect(parseAmountToMinor("12.34", "USD")).toBe(1234);
    expect(parseAmountToMinor("0.05", "USD")).toBe(5);
    expect(parseAmountToMinor("0", "USD")).toBe(0);
  });

  it("ignores currency symbols, spaces, and thousands separators", () => {
    expect(parseAmountToMinor("$1,234.56", "USD")).toBe(123456);
    expect(parseAmountToMinor("  1 234.50 ", "USD")).toBe(123450);
  });

  it("handles zero-decimal currencies", () => {
    expect(parseAmountToMinor("1000", "JPY")).toBe(1000);
    expect(parseAmountToMinor("1,000", "JPY")).toBe(1000);
  });

  it("handles three-decimal currencies", () => {
    expect(parseAmountToMinor("1.234", "BHD")).toBe(1234);
  });

  it("rounds extra precision half up", () => {
    expect(parseAmountToMinor("1.005", "USD")).toBe(101); // 1.005 -> 1.01
    expect(parseAmountToMinor("1.004", "USD")).toBe(100);
    expect(parseAmountToMinor("100.5", "JPY")).toBe(101);
    expect(parseAmountToMinor("100.4", "JPY")).toBe(100);
  });

  it("parses negative amounts", () => {
    expect(parseAmountToMinor("-12.34", "USD")).toBe(-1234);
  });

  it("throws on non-numeric input", () => {
    expect(() => parseAmountToMinor("", "USD")).toThrow();
    expect(() => parseAmountToMinor("abc", "USD")).toThrow();
    expect(() => parseAmountToMinor("1.2.3", "USD")).toThrow();
  });
});

describe("parseQuantity", () => {
  it("scales by 1000 and rounds beyond 3 places", () => {
    expect(parseQuantity("1")).toBe(1000);
    expect(parseQuantity("2.5")).toBe(2500);
    expect(parseQuantity("0.125")).toBe(125);
    expect(parseQuantity("1.2345")).toBe(1235); // round half up
  });
});

describe("parseTaxRate", () => {
  it("parses percentages into basis points", () => {
    expect(parseTaxRate("20")).toBe(2000);
    expect(parseTaxRate("8.25")).toBe(825);
    expect(parseTaxRate("8.25%")).toBe(825);
    expect(parseTaxRate("0")).toBe(0);
  });

  it("rejects negative rates", () => {
    expect(() => parseTaxRate("-1")).toThrow();
  });
});

describe("lineAmount", () => {
  it("multiplies whole quantities exactly", () => {
    expect(lineAmount(parseQuantity("3"), 1500)).toBe(4500);
  });

  it("rounds fractional quantities half up", () => {
    // 2.5 hours * $40.00 = $100.00
    expect(lineAmount(parseQuantity("2.5"), 4000)).toBe(10000);
    // 0.333 * 100 cents = 33.3 -> 33
    expect(lineAmount(parseQuantity("0.333"), 100)).toBe(33);
    // 0.335 * 100 = 33.5 -> 34
    expect(lineAmount(parseQuantity("0.335"), 100)).toBe(34);
  });

  it("handles zero", () => {
    expect(lineAmount(0, 5000)).toBe(0);
    expect(lineAmount(parseQuantity("5"), 0)).toBe(0);
  });
});

describe("computeInvoiceTotals", () => {
  it("sums lines with no tax or discount", () => {
    const t = computeInvoiceTotals({
      lines: [
        { quantity: parseQuantity("2"), unitAmount: 5000 },
        { quantity: parseQuantity("1"), unitAmount: 2500 },
      ],
    });
    expect(t.lineAmounts).toEqual([10000, 2500]);
    expect(t.subtotal).toBe(12500);
    expect(t.discount).toBe(0);
    expect(t.taxTotal).toBe(0);
    expect(t.total).toBe(12500);
  });

  it("applies tax once to the discounted subtotal (invoice-level rounding)", () => {
    // subtotal 100.00, discount 10.00, tax 8.25% on 90.00 = 7.425 -> 7.43
    const t = computeInvoiceTotals({
      lines: [{ quantity: parseQuantity("1"), unitAmount: 10000 }],
      discount: 1000,
      taxRateBps: 825,
    });
    expect(t.subtotal).toBe(10000);
    expect(t.discount).toBe(1000);
    expect(t.taxTotal).toBe(743);
    expect(t.total).toBe(9743);
  });

  it("rounds tax half up at the invoice level", () => {
    // 33.33 * 3 lines... use a subtotal that makes tax land on a half-cent.
    // subtotal 10.10, tax 5% = 0.505 -> 0.51
    const t = computeInvoiceTotals({
      lines: [{ quantity: parseQuantity("1"), unitAmount: 1010 }],
      taxRateBps: 500,
    });
    expect(t.taxTotal).toBe(51);
    expect(t.total).toBe(1061);
  });

  it("clamps a discount larger than the subtotal", () => {
    const t = computeInvoiceTotals({
      lines: [{ quantity: parseQuantity("1"), unitAmount: 5000 }],
      discount: 9999,
      taxRateBps: 1000,
    });
    expect(t.discount).toBe(5000);
    expect(t.taxTotal).toBe(0);
    expect(t.total).toBe(0);
  });

  it("handles an all-zero invoice", () => {
    const t = computeInvoiceTotals({ lines: [], discount: 0, taxRateBps: 2000 });
    expect(t).toEqual({
      lineAmounts: [],
      subtotal: 0,
      discount: 0,
      taxTotal: 0,
      total: 0,
    });
  });

  it("handles large amounts without precision loss", () => {
    // 10,000 units * $9,999.99 = $99,999,900.00 -> 9_999_990_000 cents
    const t = computeInvoiceTotals({
      lines: [{ quantity: parseQuantity("10000"), unitAmount: 999999 }],
      taxRateBps: 2000,
    });
    expect(t.subtotal).toBe(9_999_990_000);
    expect(t.taxTotal).toBe(1_999_998_000);
    expect(t.total).toBe(11_999_988_000);
  });

  it("works across multiple lines, discount, and tax together", () => {
    // 3 * 19.99 = 59.97; 1.5 * 80.00 = 120.00; subtotal 179.97
    // discount 20.00 -> 159.97; tax 7.5% = 11.99775 -> 12.00
    const t = computeInvoiceTotals({
      lines: [
        { quantity: parseQuantity("3"), unitAmount: 1999 },
        { quantity: parseQuantity("1.5"), unitAmount: 8000 },
      ],
      discount: 2000,
      taxRateBps: 750,
    });
    expect(t.subtotal).toBe(17997);
    expect(t.discount).toBe(2000);
    expect(t.taxTotal).toBe(1200);
    expect(t.total).toBe(17197);
  });

  it("rejects negative discount or tax", () => {
    expect(() => computeInvoiceTotals({ lines: [], discount: -1 })).toThrow();
    expect(() => computeInvoiceTotals({ lines: [], taxRateBps: -1 })).toThrow();
  });
});

describe("formatMoney", () => {
  it("formats common currencies", () => {
    expect(formatMoney(123456, "USD")).toBe("$1,234.56");
    expect(formatMoney(0, "USD")).toBe("$0.00");
    expect(formatMoney(5, "USD")).toBe("$0.05");
  });

  it("formats zero-decimal currencies", () => {
    expect(formatMoney(1000, "JPY")).toBe("¥1,000");
  });

  it("respects locale", () => {
    expect(formatMoney(123456, "EUR", "de-DE")).toBe("1.234,56 €");
  });
});

describe("formatQuantity", () => {
  it("trims trailing zeros", () => {
    expect(formatQuantity(2500)).toBe("2.5");
    expect(formatQuantity(3000)).toBe("3");
    expect(formatQuantity(125)).toBe("0.125");
    expect(formatQuantity(0)).toBe("0");
  });
});

describe("formatTaxRate", () => {
  it("renders basis points as a percent", () => {
    expect(formatTaxRate(2000)).toBe("20%");
    expect(formatTaxRate(825)).toBe("8.25%");
    expect(formatTaxRate(0)).toBe("0%");
    expect(formatTaxRate(750)).toBe("7.5%");
  });
});

describe("round-trip parsing and formatting", () => {
  it("parse then format returns the same display string", () => {
    for (const input of ["0.00", "1.00", "1234.56", "999999.99"]) {
      const minor = parseAmountToMinor(input, "USD");
      const formatted = formatMoney(minor, "USD");
      const reparsed = parseAmountToMinor(formatted, "USD");
      expect(reparsed).toBe(minor);
    }
  });
});
