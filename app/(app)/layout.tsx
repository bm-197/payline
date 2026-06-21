import { eq } from "drizzle-orm";
import { LayoutDashboard, ReceiptText, Settings, Users } from "lucide-react";
import { cookies } from "next/headers";
import { CommandPalette } from "@/components/command-palette";
import { Sidebar } from "@/components/sidebar";
import { Logo } from "@/components/ui/logo";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { businessProfile } from "@/lib/db/schema";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [profile, cookieStore] = await Promise.all([
    db.query.businessProfile.findFirst({ where: eq(businessProfile.userId, user.id) }),
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
      >
        {children}
      </Sidebar>
      <CommandPalette />
    </>
  );
}
