import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import {
  account,
  businessProfile,
  invitation,
  member,
  organization as organizationTable,
  session,
  user,
  verification,
} from "@/lib/db/schema";
import { getMailer } from "@/lib/email";
import { buildInviteEmail } from "@/lib/email/messages";
import { ac, roles } from "./permissions";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      organization: organizationTable,
      member,
      invitation,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  plugins: [
    organization({
      ac,
      roles,
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      membershipLimit: 100,
      sendInvitationEmail: async (data) => {
        const appUrl = process.env.APP_URL ?? "http://localhost:3000";
        await getMailer().send(
          buildInviteEmail({
            to: data.email,
            teamName: data.organization.name,
            inviterName: data.inviter.user.name || data.inviter.user.email,
            acceptUrl: `${appUrl}/invite/${data.invitation.id}`,
          }),
        );
      },
      organizationHooks: {
        // A team created from the UI gets its own business profile. (The signup hook
        // creates the personal team's profile directly, bypassing this.)
        afterCreateOrganization: async ({ organization: org, user: u }) => {
          await db
            .insert(businessProfile)
            .values({
              id: newId("business"),
              userId: u.id,
              organizationId: org.id,
              businessName: org.name,
            })
            .onConflictDoNothing();
        },
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        // New account => a personal team (the user owns it) + that team's business
        // profile, so the rest of the app always has an active team to scope to.
        after: async (created) => {
          const businessName = created.name?.trim() ? created.name : "My Business";
          const orgId = newId("organization");
          await db
            .insert(organizationTable)
            .values({ id: orgId, name: businessName, slug: `team-${created.id}` });
          await db.insert(member).values({
            id: newId("member"),
            organizationId: orgId,
            userId: created.id,
            role: "owner",
          });
          await db
            .insert(businessProfile)
            .values({
              id: newId("business"),
              userId: created.id,
              organizationId: orgId,
              businessName,
            })
            .onConflictDoNothing();
        },
      },
    },
    session: {
      create: {
        // Default the active team to the user's first membership on every new session.
        before: async (sess) => {
          const m = await db.query.member.findFirst({
            where: eq(member.userId, sess.userId),
            orderBy: [asc(member.createdAt)],
          });
          return { data: { ...sess, activeOrganizationId: m?.organizationId ?? null } };
        },
      },
    },
  },
});

export type AuthUser = typeof auth.$Infer.Session.user;
