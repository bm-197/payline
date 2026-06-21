/**
 * Customer-style invoice numbers: customer number + issue date + per-client serial,
 * e.g. "1001-20240202-001". Real, readable, and sequential.
 *
 * - customerNumber: the client's per-user number (allocated when needed)
 * - issueDate: "YYYY-MM-DD" (rendered as YYYYMMDD)
 * - seq: this client's running invoice count, zero-padded to 3 digits
 *
 * Uniqueness: (customerNumber, seq) is unique per user, so the whole number is too;
 * the unique index on (user_id, number) is the final backstop.
 */
export function formatInvoiceNumber(
  customerNumber: number,
  issueDate: string,
  seq: number,
): string {
  if (!Number.isInteger(customerNumber) || customerNumber < 1) {
    throw new Error(`customer number must be a positive integer, got ${customerNumber}`);
  }
  if (!Number.isSafeInteger(seq) || seq < 1) {
    throw new Error(`invoice sequence must be a positive integer, got ${seq}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
    throw new Error(`issue date must be YYYY-MM-DD, got ${issueDate}`);
  }
  const ymd = issueDate.replaceAll("-", "");
  return `${customerNumber}-${ymd}-${String(seq).padStart(3, "0")}`;
}
