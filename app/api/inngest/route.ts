import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sendInvoiceReminders } from "@/lib/inngest/functions/reminders";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendInvoiceReminders],
});
