import { AcceptInvite } from "@/components/accept-invite";
import { requireUser } from "@/lib/auth/server";

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Must be signed in to accept; requireUser redirects to /login otherwise.
  await requireUser();
  return <AcceptInvite invitationId={id} />;
}
