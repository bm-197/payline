export default function PrivacyPage() {
  return (
    <article className="space-y-4 text-sm text-muted">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Privacy</h1>
      <p className="text-faint">This is a placeholder policy for a v0.1 build, not legal advice.</p>
      <p>
        Payline stores the data you enter to run your account: your business profile, your clients,
        and your invoices. Payments are handled by Stripe; Payline never sees or stores full card
        numbers.
      </p>
      <p>
        We use your client email addresses only to send the invoices and reminders you ask us to
        send. We do not sell your data.
      </p>
      <p>
        Before launching for real, replace this page with a reviewed privacy policy that reflects
        your data processors, retention, and your users' rights.
      </p>
    </article>
  );
}
