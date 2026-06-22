import { notFound } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireWorkspace } from "@/lib/auth/server";
import { updateClientAction } from "@/lib/clients/actions";
import { getClient } from "@/lib/clients/queries";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await requireWorkspace();
  const existing = await getClient(orgId, id);
  if (!existing) notFound();

  const action = updateClientAction.bind(null, id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit client" subtitle={existing.name} />
      <div className="rounded-3xl border border-line bg-card p-6">
        <ClientForm action={action} defaults={existing} submitLabel="Save changes" />
      </div>
    </div>
  );
}
