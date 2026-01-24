export const ALL_PERMISSIONS = [
  // User & Identity
  "users.read",
  "users.write",
  "users.disable",
  "users.restore",
  "models.read",
  "models.write",
  "models.approve",
  "models.suspend",
  "kyc.read",

  // Moderation & Safety
  "reports.read",
  "reports.write",
  "reports.resolve",
  "blocks.read",
  "blocks.write",
  "content.read",
  "content.takedown",
  "chat.read",
  "chat.moderate",

  // Payments/Wallet
  "wallet.read",
  "wallet.adjust",
  "wallet.reconcile",
  "sirplay.mapping.read",
  "sirplay.mapping.write",
  "transactions.read",

  // Operations
  "settings.read",
  "settings.write",
  "featureflags.write",
  "audit.read",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const ALL_ROLES = [
  "user",
  "model",
  "admin",
  "support",
  "finance",
  "super_admin",
] as const;

export type Role = (typeof ALL_ROLES)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  user: [],
  model: [],

  // Baseline mapping (can be tuned): admin gets everything except featureflags.write
  admin: ALL_PERMISSIONS.filter((p) => p !== "featureflags.write"),

  support: [
    "users.read",
    "models.read",

    "reports.read",
    "reports.write",
    "reports.resolve",

    "blocks.read",
    "blocks.write",

    "chat.read",
    "chat.moderate",

    "audit.read",
  ],

  finance: [
    "wallet.read",
    "transactions.read",
    "sirplay.mapping.read",
    "audit.read",
  ],

  // Super admin: everything
  super_admin: ALL_PERMISSIONS,
} as const;

export function resolveEffectivePermissions(args: {
  role: Role;
  permissionsOverride?: unknown;
}): Set<Permission> {
  const out = new Set<Permission>(ROLE_PERMISSIONS[args.role] ?? []);

  const override = args.permissionsOverride;
  if (Array.isArray(override)) {
    for (const p of override) {
      if (typeof p === "string" && (ALL_PERMISSIONS as readonly string[]).includes(p)) {
        out.add(p as Permission);
      }
    }
  }

  return out;
}

export function hasPermission(perms: Set<Permission> | readonly Permission[], p: Permission): boolean {
  if (perms instanceof Set) return perms.has(p);
  return (perms as readonly Permission[]).includes(p);
}
