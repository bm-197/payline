export default function TermsPage() {
  return (
    <article className="space-y-4 text-sm text-muted">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Terms</h1>
      <p className="text-faint">This is a placeholder for a v0.1 build, not legal advice.</p>
      <p>
        Payline helps freelancers create invoices, collect card payments through Stripe, and send
        reminders. You are responsible for the accuracy of what you bill and for your own tax
        obligations.
      </p>
      <p>
        Payments are processed by Stripe under their terms. Payline charges a 1% fee on each paid
        invoice. Service is provided as is during this early version.
      </p>
      <p>Before launching for real, replace this page with reviewed terms of service.</p>
    </article>
  );
}
