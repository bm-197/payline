/**
 * Minor-unit metadata. The number of fractional digits a currency uses (USD=2,
 * JPY=0, BHD=3). We keep a small explicit table for the currencies Payline ships
 * with and fall back to Intl for anything else, so adding a currency never
 * silently rounds wrong.
 */

const EXPLICIT_MINOR_DIGITS: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  CAD: 2,
  AUD: 2,
  CHF: 2,
  JPY: 0,
  KRW: 0,
  BHD: 3,
  KWD: 3,
};

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"] as const;

export type CurrencyCode = string;

const intlDigitsCache = new Map<string, number>();

/** Fractional digits for a currency code (ISO 4217). Throws on an unknown code. */
export function minorUnitDigits(currency: CurrencyCode): number {
  const code = currency.toUpperCase();
  const explicit = EXPLICIT_MINOR_DIGITS[code];
  if (explicit !== undefined) return explicit;

  const cached = intlDigitsCache.get(code);
  if (cached !== undefined) return cached;

  try {
    const digits = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).resolvedOptions().maximumFractionDigits;
    if (digits === undefined) throw new Error(`Unknown currency code: ${currency}`);
    intlDigitsCache.set(code, digits);
    return digits;
  } catch {
    throw new Error(`Unknown currency code: ${currency}`);
  }
}

/** 10 ** minorUnitDigits, as a bigint. e.g. USD -> 100n, JPY -> 1n. */
export function minorUnitFactor(currency: CurrencyCode): bigint {
  return 10n ** BigInt(minorUnitDigits(currency));
}
