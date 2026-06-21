import { consoleMailer } from "./console";
import { resendMailer } from "./resend";
import type { Mailer } from "./types";

export type { EmailMessage, Mailer, SendResult } from "./types";

/** Pick the transport. Console by default; EMAIL_TRANSPORT=resend opts into Resend. */
export function getMailer(): Mailer {
  return process.env.EMAIL_TRANSPORT === "resend" ? resendMailer : consoleMailer;
}
