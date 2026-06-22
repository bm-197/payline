import { asc, eq } from "drizzle-orm";
import { LayoutDashboard, Palette, ReceiptText, Settings, Users } from "lucide-react";
import { cookies } from "next/headers";
import { CommandPalette } from "@/components/command-palette";
import { Sidebar } from "@/components/sidebar";
import { Logo } from "@/components/ui/logo";
import { requireWorkspace } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { businessProfile, member, organization } from "@/lib/db/schema";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, orgId } = await requireWorkspace();
  const [profile, teams, cookieStore] = await Promise.all([
    db.query.businessProfile.findFirst({ where: eq(businessProfile.organizationId, orgId) }),
    db
      .select({ id: organization.id, name: organization.name })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(eq(member.userId, user.id))
      .orderBy(asc(organization.name)),
    cookies(),
  ]);
  const collapsed = cookieStore.get("payline-sidebar")?.value === "collapsed";

  return (
    <>
      <Sidebar
        initialCollapsed={collapsed}
        brand={{ name: "Payline", logo: <Logo size={26} /> }}
        links={[
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: <LayoutDashboard className="size-5" strokeWidth={1.6} />,
          },
          {
            href: "/invoices",
            label: "Invoices",
            icon: <ReceiptText className="size-5" strokeWidth={1.6} />,
          },
          {
            href: "/invoice-design",
            label: "Design",
            icon: <Palette className="size-5" strokeWidth={1.6} />,
          },
          {
            href: "/clients",
            label: "Clients",
            icon: <Users className="size-5" strokeWidth={1.6} />,
          },
          {
            href: "/settings",
            label: "Settings",
            icon: <Settings className="size-5" strokeWidth={1.6} />,
          },
        ]}
        user={{ name: user.name || "Your account", sublabel: profile?.businessName }}
        teams={teams}
        activeTeamId={orgId}
      >
        {children}
      </Sidebar>
      <CommandPalette />
    </>
  );
}
