import { eq } from "drizzle-orm";
import { ConnectPayments } from "@/components/settings/connect-payments";
import { SettingsForm } from "@/components/settings/settings-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { businessProfile } from "@/lib/db/schema";
import { formatTaxRate } from "@/lib/money";
import { updateBusinessProfileAction } from "@/lib/settings/actions";
import { refreshAccountStatus } from "@/lib/stripe/connect";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await db.query.businessProfile.findFirst({
    where: eq(businessProfile.userId, user.id),
  });

  // Refresh live Stripe readiness when configured and an account exists.
  let chargesEnabled = profile?.stripeChargesEnabled ?? false;
  if (process.env.STRIPE_SECRET_KEY && profile?.stripeAccountId) {
    try {
      chargesEnabled = await refreshAccountStatus(user.id);
    } catch {
      // Fall back to the cached flag if Stripe is unreachable.
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader title="Settings" subtitle="Your business profile and defaults." />
      <ConnectPayments
        connected={Boolean(profile?.stripeAccountId)}
        chargesEnabled={chargesEnabled}
      />
      <SettingsForm
        action={updateBusinessProfileAction}
        defaults={{
          businessName: profile?.businessName ?? "",
          address: profile?.address ?? "",
          logoUrl: profile?.logoUrl ?? "",
          brandColor: profile?.brandColor ?? "",
          invoiceFooter: profile?.invoiceFooter ?? "",
          defaultCurrency: profile?.defaultCurrency ?? "USD",
          taxRate: formatTaxRate(profile?.defaultTaxRateBps ?? 0).replace("%", ""),
          paymentTermsDays: profile?.paymentTermsDays ?? 14,
          offsets: profile?.reminderOffsetDays ?? [-3, 0, 3],
        }}
      />
    </div>
  );
}
