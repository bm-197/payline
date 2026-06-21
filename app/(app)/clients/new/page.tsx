import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/ui/page-header";
import { createClientAction } from "@/lib/clients/actions";

export default function NewClientPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="New client" subtitle="Someone you want to bill." />
      <div className="rounded-3xl border border-line bg-card p-6">
        <ClientForm action={createClientAction} submitLabel="Create client" />
      </div>
    </div>
  );
}
