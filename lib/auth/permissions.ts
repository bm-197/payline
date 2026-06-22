import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * Granular per-action access control for teams. Resources `organization`, `member`,
 * `invitation` come from Better Auth's organization plugin (used as-is for membership
 * management); Payline adds its domain resources below. Shared by the server (auth) and
 * the client (UI gating), so it must stay isomorphic. See docs/adr/0002.
 */
export const statement = {
  ...defaultStatements,
  invoice: ["create", "read", "update", "send", "void", "markPaid", "delete"],
  client: ["create", "read", "update", "delete"],
  settings: ["read", "update"],
  payouts: ["read", "manage"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  ...ownerAc.statements,
  invoice: ["create", "read", "update", "send", "void", "markPaid", "delete"],
  client: ["create", "read", "update", "delete"],
  settings: ["read", "update"],
  payouts: ["read", "manage"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  invoice: ["create", "read", "update", "send", "void", "markPaid", "delete"],
  client: ["create", "read", "update", "delete"],
  settings: ["read", "update"],
  payouts: ["read"],
});

export const member = ac.newRole({
  ...memberAc.statements,
  invoice: ["create", "read", "update", "send", "markPaid"],
  client: ["create", "read", "update"],
  settings: ["read"],
  payouts: ["read"],
});

export const viewer = ac.newRole({
  invoice: ["read"],
  client: ["read"],
  settings: ["read"],
  payouts: ["read"],
});

export const roles = { owner, admin, member, viewer };
