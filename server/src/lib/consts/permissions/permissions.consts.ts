import { Role, SYSTEM_ROLES, TSystemRole } from "../roles/roles.consts.js";

// PERMISSIONS
export const PERMISSIONS = [
    // ---------------- Platform / System ----------------
    "platform:read",
    "platform:write",
    "platform:support:read",
    "platform:support:write",
    "platform:impersonate",

    "system:config:read",
    "system:config:write",
    "system:rules:read",
    "system:rules:modify",

    // ---------------- Organization ----------------
    "org:read",
    "org:write",
    "org:admin",

    // ---------------- Roles & Users ----------------
    "role:read",
    "role:write",
    "role:assign",
    "users:read",
    "users:write",
    "users:invite",
    "users:suspend",

    // ---------------- Branch ----------------
    "branch:read",
    "branch:write",
    "branch:create",
    "branch:deactivate",

    // ---------------- Category ----------------
    "category:read",
    "category:create",
    "category:update",
    "category:deactivate",
    "category:version",

    // ---------------- Product ----------------
    "product:read",
    "product:create",
    "product:update",
    "product:archive",
    "product:import",

    // ---------------- Pricing ----------------
    "pricing:read",
    "pricing:update", // creates new PriceList version
    "pricing:override", // allow override beyond rule engine (sensitive)

    // ---------------- Inventory ----------------
    "inventory:read",
    "inventory:manage", // opening/purchase/adjust
    "inventory:transfer", // branch transfer
    "inventory:damage", // damage stock
    "inventory:audit", // stock audit/closing

    // ---------------- Vendor ----------------
    "vendor:read",
    "vendor:create",
    "vendor:update",
    "vendor:deactivate",
    "vendor:payout", // money moving (super sensitive)

    // ---------------- Billing / POS ----------------
    "billing:read",
    "billing:create",
    "billing:cancel:request",
    "billing:cancel:approve",
    "billing:cancel:any", // org owner only

    "billing:price:edit", // sales girls cannot do this
    "billing:discount:apply",
    "billing:splitPayment",

    // ---------------- Returns / Exchange ----------------
    "returns:read",
    "returns:create",
    "returns:approve",
    "returns:approve:any",

    // ---------------- Customer ----------------
    "customer:read",
    "customer:create",
    "customer:update",

    // ---------------- Wallet ----------------
    "wallet:read",
    "wallet:apply",
    "wallet:rules:read",
    "wallet:rules:manage",

    // ---------------- Staff Incentives ----------------
    "incentive:read",
    "incentive:earn",
    "incentive:rules:manage",

    // ---------------- Influencer / Promo System ----------------
    "promo:read",
    "promo:create",
    "promo:update",
    "promo:deactivate",

    "influencer:read",
    "influencer:create",
    "influencer:update",
    "influencer:manage:branch", // branch manager ability
    "influencer:metrics:read", // influencer self access

    "commission:read",
    "commission:payout",

    // ---------------- Reports ----------------
    "reports:read",
    "reports:branch:read",
    "reports:staff:performance",
    "reports:influencer",

    // ---------------- Audit & Logs ----------------
    "logs:read",
    "audit:read",
] as const;

export type TPermission = (typeof PERMISSIONS)[number];

// enum-like object for autocomplete (Permission["billing.read"])
export const Permission = Object.freeze(
    Object.fromEntries(PERMISSIONS.map((p) => [p, p]))
) as { [K in TPermission]: K };

export const isPermission = (value: unknown): value is TPermission =>
    typeof value === "string" &&
    (PERMISSIONS as readonly string[]).includes(value);

// This type forces:
// ✅ all roles must exist
// ✅ only allowed permissions can be used
export type TRolePermissionMap = Record<TSystemRole, readonly TPermission[]>;

export const ROLE_PERMISSIONS = {
    // ===================== TECHENTIA =====================
    [Role.TECHENTIA_SUPER_ADMIN]: [
        Permission["platform:read"],
        Permission["platform:write"],
        Permission["platform:support:read"],
        Permission["platform:support:write"],
        Permission["platform:impersonate"],

        Permission["system:config:read"],
        Permission["system:config:write"],
        Permission["system:rules:read"],
        Permission["system:rules:modify"],

        Permission["org:read"],
        Permission["org:write"],
        Permission["org:admin"],

        Permission["reports:read"],
        Permission["logs:read"],
        Permission["audit:read"],
    ],

    [Role.TECHENTIA_ADMIN]: [
        Permission["platform:read"],
        Permission["platform:support:read"],
        Permission["platform:support:write"],

        Permission["org:read"],
        Permission["users:read"],

        Permission["reports:read"],
        Permission["logs:read"],
    ],

    [Role.TECHENTIA_USER]: [
        Permission["platform:support:read"],
        Permission["org:read"],
        Permission["users:read"],
        Permission["logs:read"],
    ],

    // ===================== TENANT =====================
    [Role.TENANT_SUPER_ADMIN]: [
        Permission["org:admin"],
        Permission["org:read"],
        Permission["org:write"],

        Permission["role:read"],
        Permission["role:write"],
        Permission["role:assign"],

        Permission["users:read"],
        Permission["users:write"],
        Permission["users:invite"],
        Permission["users:suspend"],

        Permission["branch:read"],
        Permission["branch:create"],
        Permission["branch:write"],
        Permission["branch:deactivate"],

        Permission["category:read"],
        Permission["category:create"],
        Permission["category:update"],
        Permission["category:deactivate"],
        Permission["category:version"],

        Permission["product:read"],
        Permission["product:create"],
        Permission["product:update"],
        Permission["product:archive"],
        Permission["product:import"],

        Permission["pricing:read"],
        Permission["pricing:update"],
        Permission["pricing:override"],

        Permission["inventory:read"],
        Permission["inventory:manage"],
        Permission["inventory:transfer"],
        Permission["inventory:damage"],
        Permission["inventory:audit"],

        Permission["vendor:read"],
        Permission["vendor:create"],
        Permission["vendor:update"],
        Permission["vendor:deactivate"],
        Permission["vendor:payout"],

        Permission["billing:read"],
        Permission["billing:create"],
        Permission["billing:discount:apply"],
        Permission["billing:splitPayment"],
        Permission["billing:cancel:any"],
        Permission["billing:price:edit"],

        Permission["returns:read"],
        Permission["returns:create"],
        Permission["returns:approve:any"],

        Permission["customer:read"],
        Permission["customer:create"],
        Permission["customer:update"],

        Permission["wallet:read"],
        Permission["wallet:apply"],
        Permission["wallet:rules:read"],
        Permission["wallet:rules:manage"],

        Permission["promo:read"],
        Permission["promo:create"],
        Permission["promo:update"],
        Permission["promo:deactivate"],

        Permission["influencer:read"],
        Permission["influencer:create"],
        Permission["influencer:update"],

        Permission["commission:read"],
        Permission["commission:payout"],

        Permission["incentive:read"],
        Permission["incentive:rules:manage"],

        Permission["reports:read"],
        Permission["reports:branch:read"],
        Permission["reports:staff:performance"],
        Permission["reports:influencer"],

        Permission["logs:read"],
        Permission["audit:read"],
    ],

    [Role.TENANT_ADMIN]: [
        Permission["org:read"],

        Permission["users:read"],
        Permission["users:invite"],

        Permission["branch:read"],

        Permission["category:read"],
        Permission["category:create"],
        Permission["category:update"],
        Permission["category:version"],

        Permission["product:read"],
        Permission["product:create"],
        Permission["product:update"],
        Permission["product:archive"],
        Permission["product:import"],

        Permission["pricing:read"],
        Permission["pricing:update"],

        Permission["inventory:read"],
        Permission["inventory:manage"],
        Permission["inventory:transfer"],
        Permission["inventory:damage"],

        Permission["vendor:read"],
        Permission["vendor:create"],
        Permission["vendor:update"],

        Permission["billing:read"],
        Permission["billing:create"],
        Permission["billing:discount:apply"],
        Permission["billing:splitPayment"],
        Permission["billing:cancel:request"],

        Permission["returns:read"],
        Permission["returns:create"],

        Permission["customer:read"],
        Permission["customer:create"],

        Permission["wallet:read"],
        Permission["wallet:apply"],
        Permission["wallet:rules:read"],

        Permission["promo:read"],
        Permission["promo:create"],
        Permission["promo:update"],

        Permission["influencer:read"],
        Permission["influencer:create"],
        Permission["influencer:update"],

        Permission["commission:read"],

        Permission["incentive:read"],

        Permission["reports:read"],
        Permission["reports:branch:read"],

        Permission["logs:read"],
    ],

    [Role.BRANCH_MANAGER]: [
        Permission["branch:read"],

        Permission["inventory:read"],
        Permission["inventory:manage"],
        Permission["inventory:transfer"],
        Permission["inventory:damage"],

        Permission["billing:read"],
        Permission["billing:create"],
        Permission["billing:cancel:approve"],

        Permission["returns:read"],
        Permission["returns:approve"],

        Permission["reports:branch:read"],
        Permission["reports:staff:performance"],

        Permission["influencer:manage:branch"],
        Permission["influencer:read"],

        Permission["customer:read"],
    ],

    [Role.BILLING_STAFF]: [
        Permission["billing:create"],
        Permission["billing:read"],

        Permission["customer:read"],
        Permission["customer:create"],

        Permission["wallet:read"],
        Permission["wallet:apply"],

        Permission["promo:read"],
        Permission["billing:discount:apply"],

        Permission["inventory:read"],

        Permission["incentive:earn"],
    ],

    [Role.SALES_GIRL]: [
        Permission["billing:create"],
        Permission["billing:read"],

        Permission["customer:read"],

        Permission["promo:read"],
        Permission["billing:discount:apply"],

        Permission["inventory:read"],

        Permission["incentive:earn"],
    ],

    [Role.INFLUENCER]: [
        Permission["influencer:metrics:read"],
        Permission["commission:read"],
    ],

    [Role.CUSTOMER]: [Permission["wallet:read"]],
} as const satisfies TRolePermissionMap;

// =============================
// FAST LOOKUP CACHE
// =============================
export type TRolePermissionSetMap = Record<TSystemRole, ReadonlySet<TPermission>>;

export const ROLE_PERMISSION_SETS: TRolePermissionSetMap = (() => {
  const map: Partial<TRolePermissionSetMap> = {};

  for (const role of SYSTEM_ROLES) {
    map[role] = new Set(ROLE_PERMISSIONS[role]);
  }

  return Object.freeze(map) as TRolePermissionSetMap;
})();

// Helpful API
export const getRolePermissions = (role: TSystemRole): readonly TPermission[] => ROLE_PERMISSIONS[role];

export const getRolePermissionSet = (role: TSystemRole): ReadonlySet<TPermission> => ROLE_PERMISSION_SETS[role];
