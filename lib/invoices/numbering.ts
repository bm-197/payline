/**
 * Sequential invoice numbers, scoped per user. The sequence counter lives on the
 * business profile (next_invoice_seq) and is allocated transactionally when an
 * invoice is created (M2). These helpers are the pure formatting half.
 */

const MIN_DIGITS = 4;

/** formatInvoiceNumber("INV-", 7) -> "INV-0007". */
export function formatInvoiceNumber(prefix: string, seq: number): string {
  if (!Number.isSafeInteger(seq) || seq < 1) {
    throw new Error(`invoice sequence must be a positive integer, got ${seq}`);
  }
  return `${prefix}${String(seq).padStart(MIN_DIGITS, "0")}`;
}
