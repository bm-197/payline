"use server";

import { requireWorkspace } from "@/lib/auth/server";
import { createOnboardingLink, getOrCreateConnectedAccount } from "@/lib/stripe/connect";

export type ConnectResult = { url?: string; error?: string };

/** Start (or resume) Stripe Express onboarding; returns a hosted link to redirect to. */
export async function startStripeOnboarding(): Promise<ConnectResult> {
  const { user, orgId, can } = await requireWorkspace();
  if (!can("payouts", "manage")) {
    return { error: "Only an owner can set up payouts for this team." };
  }
  try {
    const accountId = await getOrCreateConnectedAccount(orgId, user.email);
    const url = await createOnboardingLink(accountId);
    return { url };
  } catch (err) {
    // Real reason stays in the server log; users see a calm, generic message.
    console.error("[stripe connect] onboarding failed:", (err as Error).message);
    return { error: "We couldn't start payout setup just now. Please try again in a moment." };
  }
}
