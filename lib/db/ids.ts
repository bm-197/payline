import { customAlphabet } from "nanoid";

// Unambiguous alphabet (no look-alikes like 0/O, 1/l/I).
const alphabet = "23456789abcdefghijkmnpqrstuvwxyz";
const nano = customAlphabet(alphabet, 16);
const tokenNano = customAlphabet(alphabet, 32);

export const ID_PREFIXES = {
  user: "usr",
  organization: "org",
  member: "mem",
  invitation: "invt",
  business: "biz",
  client: "cli",
  invoice: "inv",
  lineItem: "li",
  payment: "pay",
  stripeEvent: "evt",
  reminder: "rem",
  activity: "act",
} as const;

export type IdEntity = keyof typeof ID_PREFIXES;

/** Prefixed nanoid, e.g. newId("invoice") -> "inv_x7k2...". */
export function newId(entity: IdEntity): string {
  return `${ID_PREFIXES[entity]}_${nano()}`;
}

/** Long unguessable token for public invoice URLs. */
export function newPublicToken(): string {
  return tokenNano();
}
