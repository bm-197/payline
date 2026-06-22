import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { member } from "@/lib/db/schema";
import { auth } from "./index";
import { roles } from "./permissions";

type Resource = "invoice" | "client" | "settings" | "payouts";
export type Can = (resource: Resource, action: string) => boolean;

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/** Server-component / action guard: returns the user or redirects to /login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Workspace guard: the user plus their active team (organization) and role in it.
 * Every domain query/action scopes by `orgId`. Falls back to the user's first team
 * when the session has no active one yet (older sessions). See docs/adr/0002.
 */
export async function requireWorkspace() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const user = session.user;

  const active = (session.session as { activeOrganizationId?: string | null }).activeOrganizationId;
  const mem = active
    ? await db.query.member.findFirst({
        where: and(eq(member.userId, user.id), eq(member.organizationId, active)),
      })
    : await db.query.member.findFirst({
        where: eq(member.userId, user.id),
        orderBy: [asc(member.createdAt)],
      });

  if (!mem) redirect("/login");

  // A member may hold several comma-separated roles; allowed if any grants it.
  const roleNames = mem.role.split(",");
  const can: Can = (resource, action) =>
    roleNames.some(
      (rn) => roles[rn as keyof typeof roles]?.authorize({ [resource]: [action] }).success ?? false,
    );

  return { user, orgId: mem.organizationId, role: mem.role, can };
}
