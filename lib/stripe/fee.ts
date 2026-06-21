/** Platform fee in basis points (1%). Applied to each paid invoice. */
export const APPLICATION_FEE_BPS = 100;

/** Payline's fee on an invoice total (minor units), rounded to the nearest unit. */
export function applicationFee(total: number): number {
  return Math.round((total * APPLICATION_FEE_BPS) / 10_000);
}
