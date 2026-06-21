"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { newId } from "@/lib/db/ids";
import { client } from "@/lib/db/schema";

export type ClientFormState = { error?: string };

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  email: z.union([z.string().trim().email("Enter a valid email."), z.literal("")]),
  company: z.string().trim().max(200).optional(),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
});

function parse(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    company: formData.get("company") ?? "",
    address: formData.get("address") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

function toValues(data: z.infer<typeof clientSchema>) {
  return {
    name: data.name,
    email: data.email === "" ? null : data.email,
    company: data.company || null,
    address: data.address || null,
    notes: data.notes || null,
  };
}

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  await db.insert(client).values({
    id: newId("client"),
    userId: user.id,
    ...toValues(parsed.data),
  });

  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClientAction(
  id: string,
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  await db
    .update(client)
    .set(toValues(parsed.data))
    .where(and(eq(client.id, id), eq(client.userId, user.id)));

  revalidatePath("/clients");
  redirect("/clients");
}

export async function deleteClientAction(id: string) {
  const user = await requireUser();
  await db.delete(client).where(and(eq(client.id, id), eq(client.userId, user.id)));
  revalidatePath("/clients");
}
