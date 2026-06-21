import type { EmailMessage, Mailer, SendResult } from "./types";

let counter = 0;

/** Dev transport: logs the envelope (never secrets) and returns a fake id. */
export const consoleMailer: Mailer = {
  name: "console",
  async send(message: EmailMessage): Promise<SendResult> {
    const id = `log_${++counter}`;
    console.log(
      `[mail:${id}] to=${message.to} subject=${JSON.stringify(message.subject)}\n${message.text}`,
    );
    return { id };
  },
};
