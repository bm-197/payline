export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendResult = { id: string };

export interface Mailer {
  readonly name: string;
  send(message: EmailMessage): Promise<SendResult>;
}
