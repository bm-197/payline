"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { businessProfile } from "@/lib/db/schema";
import { type InvoiceTheme, themeSchema } from "@/lib/invoices/theme";

export type ThemeSaveState = { error?: string; ok?: boolean };

/** Persist the invoice theme for the current freelancer. */
export async function saveInvoiceThemeAction(raw: InvoiceTheme): Promise<ThemeSaveState> {
  const { orgId, can } = await requireWorkspace();
  if (!can("settings", "update")) return { error: "You don't have permission to edit settings." };
  const parsed = themeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "That theme has an invalid value." };
  }

  await db
    .update(businessProfile)
    .set({ theme: parsed.data })
    .where(eq(businessProfile.organizationId, orgId));

  revalidatePath("/invoice-design");
  revalidatePath("/invoices");
  return { ok: true };
}
