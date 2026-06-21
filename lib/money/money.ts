import { type CurrencyCode, minorUnitDigits, minorUnitFactor } from "./currency";

/**
 * Money core. Everything is integer minor units (cents); never a float.
 *
 * Rounding policy (see DECISIONS.md): round half up, applied at the INVOICE
 * level. Line amounts are summed exactly, the discount is subtracted, then tax
 * is applied to the discounted subtotal with a single rounding step.
 *
 * Quantities support up to 3 decimal places and are carried as integers scaled
 * by QUANTITY_SCALE (2.5 -> 2500). Tax rates are integer basis points
 * (8.25% -> 825), one part in TAX_RATE_DENOMINATOR.
 */

export const QUANTITY_SCALE = 1000;
const QUANTITY_SCALE_BIG = 1000n;
export const TAX_RATE_DENOMINATOR = 10_000;
const TAX_RATE_DENOMINATOR_BIG = 10_000n;

export type Money = number;
export type QuantityScaled = number;
export type TaxRateBps = number;

/** Floor division for bigints (rounds toward negative infinity). */
function floorDiv(a: bigint, b: bigint): bigint {
  const q = a / b;
  const r = a % b;
  return r !== 0n && r < 0n !== b < 0n ? q - 1n : q;
}

/** Divide a/b rounding half up (ties go toward positive infinity). b must be > 0. */
export function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error("denominator must be positive");
  return floorDiv(2n * numerator + denominator, 2n * denominator);
}

function toSafeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error(`money value out of safe integer range: ${value}`);
  }
  return Number(value);
}

function assertInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be a safe integer, got ${value}`);
  }
}

/**
 * Parse a decimal string into an integer scaled by 10**digits, rounding half up
 * for any precision beyond `digits`. Accepts thousands separators and a leading
 * sign. Throws on anything that is not a number.
 */
function parseDecimalToScaled(input: string, digits: number): bigint {
  const trimmed = input.trim();
  if (trimmed === "") throw new Error("empty amount");

  const negative = trimmed.startsWith("-");
  // Strip sign, currency symbols/letters, spaces, and thousands commas.
  const cleaned = trimmed.replace(/^[+-]/, "").replace(/[^\d.]/g, "");
  if (cleaned === "" || cleaned === ".") throw new Error(`invalid amount: ${input}`);

  const parts = cleaned.split(".");
  if (parts.length > 2) throw new Error(`invalid amount: ${input}`);
  const intPart = parts[0] === "" ? "0" : (parts[0] as string);
  const fracPart = parts[1] ?? "";

  const kept = fracPart.slice(0, digits).padEnd(digits, "0");
  let scaled = BigInt(intPart + kept);

  // Round half up using the first dropped digit.
  const nextDigit = fracPart[digits];
  if (nextDigit !== undefined && nextDigit >= "5") scaled += 1n;

  return negative ? -scaled : scaled;
}

/** Parse user input ("1,234.56", "$1234", "12") into minor units for a currency. */
export function parseAmountToMinor(input: string, currency: CurrencyCode): Money {
  return toSafeNumber(parseDecimalToScaled(input, minorUnitDigits(currency)));
}

/** Parse a quantity string ("2.5", "10") into a QUANTITY_SCALE-scaled integer. */
export function parseQuantity(input: string): QuantityScaled {
  return toSafeNumber(parseDecimalToScaled(input, 3));
}

/** Parse a percentage string ("8.25", "8.25%", "20") into basis points. */
export function parseTaxRate(input: string): TaxRateBps {
  const bps = toSafeNumber(parseDecimalToScaled(input, 2));
  if (bps < 0) throw new Error("tax rate cannot be negative");
  return bps;
}

/** Amount for a single line: quantity * unit, rounded half up to minor units. */
export function lineAmount(quantity: QuantityScaled, unitAmount: Money): Money {
  assertInteger(quantity, "quantity");
  assertInteger(unitAmount, "unitAmount");
  return toSafeNumber(roundHalfUp(BigInt(quantity) * BigInt(unitAmount), QUANTITY_SCALE_BIG));
}

export type InvoiceLineInput = {
  quantity: QuantityScaled;
  unitAmount: Money;
};

export type InvoiceTotals = {
  lineAmounts: Money[];
  subtotal: Money;
  discount: Money;
  taxTotal: Money;
  total: Money;
};

/**
 * Compute invoice totals with invoice-level rounding. Discount is an absolute
 * amount in minor units and is clamped to [0, subtotal]. Tax is applied once to
 * the discounted subtotal.
 */
export function computeInvoiceTotals(input: {
  lines: InvoiceLineInput[];
  discount?: Money;
  taxRateBps?: TaxRateBps;
}): InvoiceTotals {
  const discountRequested = input.discount ?? 0;
  const taxRateBps = input.taxRateBps ?? 0;
  assertInteger(discountRequested, "discount");
  assertInteger(taxRateBps, "taxRateBps");
  if (discountRequested < 0) throw new Error("discount cannot be negative");
  if (taxRateBps < 0) throw new Error("tax rate cannot be negative");

  const lineAmounts = input.lines.map((l) => lineAmount(l.quantity, l.unitAmount));
  const subtotal = lineAmounts.reduce((sum, a) => sum + a, 0);
  if (subtotal < 0) throw new Error("subtotal cannot be negative");

  const discount = Math.min(discountRequested, subtotal);
  const afterDiscount = subtotal - discount;

  const taxTotal = toSafeNumber(
    roundHalfUp(BigInt(afterDiscount) * BigInt(taxRateBps), TAX_RATE_DENOMINATOR_BIG),
  );
  const total = afterDiscount + taxTotal;

  return { lineAmounts, subtotal, discount, taxTotal, total };
}

/** Format minor units for display via Intl. */
export function formatMoney(minor: Money, currency: CurrencyCode, locale = "en-US"): string {
  assertInteger(minor, "minor");
  const factor = minorUnitFactor(currency);
  const value = Number(minor) / Number(factor);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

/** Format a scaled quantity back to a trimmed string ("2500" -> "2.5"). */
export function formatQuantity(quantity: QuantityScaled): string {
  assertInteger(quantity, "quantity");
  const negative = quantity < 0;
  const abs = Math.abs(quantity);
  const whole = Math.trunc(abs / QUANTITY_SCALE);
  const frac = abs % QUANTITY_SCALE;
  const fracStr = String(frac).padStart(3, "0").replace(/0+$/, "");
  const body = fracStr === "" ? `${whole}` : `${whole}.${fracStr}`;
  return negative ? `-${body}` : body;
}

/** Format basis points as a percentage string ("825" -> "8.25%"). */
export function formatTaxRate(bps: TaxRateBps): string {
  assertInteger(bps, "bps");
  const whole = Math.trunc(bps / 100);
  const frac = Math.abs(bps % 100);
  const fracStr = String(frac).padStart(2, "0").replace(/0+$/, "");
  return fracStr === "" ? `${whole}%` : `${whole}.${fracStr}%`;
}
