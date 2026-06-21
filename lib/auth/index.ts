import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { account, businessProfile, session, user, verification } from "@/lib/db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  databaseHooks: {
    user: {
      create: {
        // One user = one freelance business. Give every new account a profile to
        // edit in settings, so the rest of the app never has to null-check it.
        after: async (created) => {
          const businessName = created.name?.trim() ? created.name : "My Business";
          await db
            .insert(businessProfile)
            .values({ id: newId("business"), userId: created.id, businessName })
            .onConflictDoNothing();
        },
      },
    },
  },
});

export type AuthUser = typeof auth.$Infer.Session.user;
