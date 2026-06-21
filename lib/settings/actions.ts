"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { businessProfile } from "@/lib/db/schema";
import { parseTaxRate } from "@/lib/money";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currency";

export type SettingsState = { error?: string; ok?: boolean };

const schema = z.object({
  businessName: z.string().trim().min(1, "Business name is required.").max(200),
  address: z.string().trim().max(500).optional(),
  defaultCurrency: z.enum(SUPPORTED_CURRENCIES),
  taxRate: z.string().default("0"),
  paymentTermsDays: z.coerce.number().int().min(0).max(365),
});

export async function updateBusinessProfileAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();

  const parsed = schema.safeParse({
    businessName: formData.get("businessName") ?? "",
    address: formData.get("address") ?? "",
    defaultCurrency: formData.get("defaultCurrency") ?? "USD",
    taxRate: formData.get("taxRate") ?? "0",
    paymentTermsDays: formData.get("paymentTermsDays") ?? "0",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  let taxBps: number;
  try {
    taxBps = parseTaxRate(parsed.data.taxRate || "0");
  } catch {
    return { error: "Tax rate must be a number." };
  }

  // Reminder schedule: checkbox values (days relative to due date).
  const offsets = Array.from(
    new Set(
      formData
        .getAll("offsets")
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n >= -365 && n <= 365),
    ),
  ).sort((a, b) => a - b);

  await db
    .update(businessProfile)
    .set({
      businessName: parsed.data.businessName,
      address: parsed.data.address || null,
      defaultCurrency: parsed.data.defaultCurrency,
      defaultTaxRateBps: taxBps,
      paymentTermsDays: parsed.data.paymentTermsDays,
      reminderOffsetDays: offsets,
    })
    .where(eq(businessProfile.userId, user.id));

  revalidatePath("/settings");
  return { ok: true };
}
