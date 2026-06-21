/**
 * Client-style invoice numbers: client number + issue date + per-client serial,
 * e.g. "1001-20240202-001". Real, readable, and sequential.
 *
 * - clientNumber: the client's per-user number (allocated when needed)
 * - issueDate: "YYYY-MM-DD" (rendered as YYYYMMDD)
 * - seq: this client's running invoice count, zero-padded to 3 digits
 *
 * Uniqueness: (clientNumber, seq) is unique per user, so the whole number is too;
 * the unique index on (user_id, number) is the final backstop.
 */
export function formatInvoiceNumber(clientNumber: number, issueDate: string, seq: number): string {
  if (!Number.isInteger(clientNumber) || clientNumber < 1) {
    throw new Error(`client number must be a positive integer, got ${clientNumber}`);
  }
  if (!Number.isSafeInteger(seq) || seq < 1) {
    throw new Error(`invoice sequence must be a positive integer, got ${seq}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
    throw new Error(`issue date must be YYYY-MM-DD, got ${issueDate}`);
  }
  const ymd = issueDate.replaceAll("-", "");
  return `${clientNumber}-${ymd}-${String(seq).padStart(3, "0")}`;
}
