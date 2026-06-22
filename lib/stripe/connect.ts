import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessProfile } from "@/lib/db/schema";
import { getStripe } from "./client";

export { APPLICATION_FEE_BPS, applicationFee } from "./fee";

/**
 * Stripe Connect on the v2 Core Accounts API. Each freelancer is a "recipient"
 * configuration (the v2 model for destination charges without on_behalf_of: the
 * platform is merchant of record, funds are transferred to the freelancer), on an
 * Express dashboard. We request the recipient's stripe_transfers capability so a
 * destination charge can route to them; Stripe pays out their balance to bank.
 */

/** Get the team's connected v2 account id, creating it on first use. */
export async function getOrCreateConnectedAccount(orgId: string, email?: string): Promise<string> {
  const profile = await db.query.businessProfile.findFirst({
    where: eq(businessProfile.organizationId, orgId),
  });
  if (profile?.stripeAccountId) return profile.stripeAccountId;

  const account = await getStripe().v2.core.accounts.create({
    contact_email: email,
    display_name: profile?.businessName ?? undefined,
    dashboard: "express",
    // v2 requires the recipient's country at create. We default to US for v0.1;
    // a per-freelancer country field in Settings would unlock other countries.
    identity: { country: "US" },
    // Recipient config (destination charges without on_behalf_of) makes the
    // platform the merchant of record, so it collects fees and bears losses.
    // Country/currency are collected during onboarding.
    defaults: {
      responsibilities: { fees_collector: "application", losses_collector: "application" },
    },
    configuration: {
      recipient: {
        capabilities: {
          stripe_balance: {
            stripe_transfers: { requested: true },
          },
        },
      },
    },
  });

  await db
    .update(businessProfile)
    .set({ stripeAccountId: account.id })
    .where(eq(businessProfile.organizationId, orgId));
  return account.id;
}

/** Hosted onboarding link (v2 Account Link) for the recipient configuration. */
export async function createOnboardingLink(accountId: string): Promise<string> {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const link = await getStripe().v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["recipient"],
        refresh_url: `${appUrl}/settings?connect=refresh`,
        return_url: `${appUrl}/settings?connect=done`,
      },
    },
  });
  return link.url;
}

/**
 * Pull live readiness from Stripe and cache it. "Ready" means the recipient can
 * receive a destination charge, i.e. the stripe_transfers capability is active.
 */
export async function refreshAccountStatus(orgId: string): Promise<boolean> {
  const profile = await db.query.businessProfile.findFirst({
    where: eq(businessProfile.organizationId, orgId),
  });
  if (!profile?.stripeAccountId) return false;

  const account = await getStripe().v2.core.accounts.retrieve(profile.stripeAccountId, {
    include: ["configuration.recipient"],
  });
  const transfers =
    account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status;
  const enabled = transfers === "active";

  if (enabled !== profile.stripeChargesEnabled) {
    await db
      .update(businessProfile)
      .set({ stripeChargesEnabled: enabled })
      .where(eq(businessProfile.organizationId, orgId));
  }
  return enabled;
}
