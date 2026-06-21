import { eq } from "drizzle-orm";
import { ThemeEditor } from "@/components/invoices/theme-editor";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { businessProfile } from "@/lib/db/schema";
import { sampleInvoice } from "@/lib/invoices/sample";
import { parseTheme } from "@/lib/invoices/theme";

export default async function InvoiceDesignPage() {
  const user = await requireUser();
  const profile = await db.query.businessProfile.findFirst({
    where: eq(businessProfile.userId, user.id),
  });
  const theme = parseTheme(profile?.theme);
  const sample = sampleInvoice(profile?.businessName ?? "Your business", profile?.address ?? null);

  return (
    <div>
      <PageHeader
        title="Invoice design"
        subtitle="Style your invoices once. Every invoice and PDF follows it."
      />
      <ThemeEditor
        savedTheme={theme}
        sample={sample}
        appUrl={process.env.APP_URL ?? "http://localhost:3000"}
      />
    </div>
  );
}
