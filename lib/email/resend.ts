import type { EmailMessage, Mailer, SendResult } from "./types";

/**
 * Stubbed Resend adapter (v0.1). The real implementation will POST to Resend with
 * RESEND_API_KEY; until then this stays a clearly-failing placeholder so nothing
 * silently swallows production mail. Wire it up when leaving test mode.
 */
export const resendMailer: Mailer = {
  name: "resend",
  async send(_message: EmailMessage): Promise<SendResult> {
    throw new Error("Resend transport is not configured yet (v0.1 uses the console transport).");
  },
};
