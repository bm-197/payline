import Stripe from "stripe";

// Lazy: constructing Stripe with an empty key throws, which would break the build
// (page-data collection imports the webhook route). Build the client on first use.
let instance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!instance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    instance = new Stripe(key, { typescript: true });
  }
  return instance;
}
