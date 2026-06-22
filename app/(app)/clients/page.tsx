import Link from "next/link";
import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { TableKeyboardNav } from "@/components/ui/table-keyboard-nav";
import { requireWorkspace } from "@/lib/auth/server";
import { listClients } from "@/lib/clients/queries";

export default async function ClientsPage() {
  const { orgId } = await requireWorkspace();
  const clients = await listClients(orgId);

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="The people and companies you bill."
        action={
          <Link href="/clients/new">
            <Button>New client</Button>
          </Link>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          line="No clients yet."
          hint="Add the first person you invoice."
          action={
            <Link href="/clients/new">
              <Button>Add a client</Button>
            </Link>
          }
        />
      ) : (
        <TableKeyboardNav>
          <div className="rounded-3xl border border-line bg-card">
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Invoices</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {clients.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <Link
                        href={`/clients/${c.id}/edit`}
                        data-row-link
                        className="rounded font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                      >
                        {c.name}
                      </Link>
                      {c.company ? <span className="ml-2 text-faint">{c.company}</span> : null}
                    </TD>
                    <TD className="text-muted">
                      {c.email ?? <span className="text-faint">Not set</span>}
                    </TD>
                    <TD className="font-geist tabular-nums text-muted">{c.invoiceCount}</TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center gap-4">
                        <Link
                          href={`/clients/${c.id}/edit`}
                          className="text-sm text-muted transition hover:text-ink"
                        >
                          Edit
                        </Link>
                        <DeleteClientButton id={c.id} disabled={c.invoiceCount > 0} />
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </TableKeyboardNav>
      )}
    </div>
  );
}
