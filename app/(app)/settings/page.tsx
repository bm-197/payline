import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { ConnectPayments } from "@/components/settings/connect-payments";
import { SettingsForm } from "@/components/settings/settings-form";
import { TeamMembers } from "@/components/team-members";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/lib/auth";
import { requireWorkspace } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { businessProfile } from "@/lib/db/schema";
import { formatTaxRate } from "@/lib/money";
import { updateBusinessProfileAction } from "@/lib/settings/actions";
import { refreshAccountStatus } from "@/lib/stripe/connect";

export default async function SettingsPage() {
  const { user, orgId, role } = await requireWorkspace();
  const [profile, fullOrg] = await Promise.all([
    db.query.businessProfile.findFirst({ where: eq(businessProfile.organizationId, orgId) }),
    auth.api.getFullOrganization({ headers: await headers() }),
  ]);
  const members = (fullOrg?.members ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    name: m.user?.name ?? "",
    email: m.user?.email ?? "",
  }));
  const invitations = (fullOrg?.invitations ?? [])
    .filter((i) => i.status === "pending")
    .map((i) => ({ id: i.id, email: i.email, role: i.role }));
  const canManage = role === "owner" || role === "admin";

  // Refresh live Stripe readiness when configured and an account exists.
  let chargesEnabled = profile?.stripeChargesEnabled ?? false;
  if (process.env.STRIPE_SECRET_KEY && profile?.stripeAccountId) {
    try {
      chargesEnabled = await refreshAccountStatus(orgId);
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
          defaultCurrency: profile?.defaultCurrency ?? "USD",
          taxRate: formatTaxRate(profile?.defaultTaxRateBps ?? 0).replace("%", ""),
          paymentTermsDays: profile?.paymentTermsDays ?? 14,
          offsets: profile?.reminderOffsetDays ?? [-3, 0, 3],
        }}
      />
      <TeamMembers
        members={members}
        invitations={invitations}
        canManage={canManage}
        currentUserEmail={user.email}
      />
    </div>
  );
}
