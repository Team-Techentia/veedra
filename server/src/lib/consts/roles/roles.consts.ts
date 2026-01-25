// ROLES
export const SYSTEM_ROLES = [
    // --- Techentia Platform Roles ---
    "TECHENTIA_SUPER_ADMIN",
    "TECHENTIA_ADMIN",
    "TECHENTIA_USER",

    // --- Tenant Roles ---
    "TENANT_SUPER_ADMIN",
    "TENANT_ADMIN",
    "BRANCH_MANAGER",
    "BILLING_STAFF",
    "SALES_PERSON",

    // --- External ---
    "INFLUENCER",
    "CUSTOMER",
] as const;

export type TSystemRole = (typeof SYSTEM_ROLES)[number];

// enum-like object for autocomplete (Role.TENANT_ADMIN etc.)
export const Role = Object.freeze(Object.fromEntries(SYSTEM_ROLES.map((r) => [r, r]))) as { [K in TSystemRole]: K };

export const INTERNAL_ROLES = [
    Role.TENANT_SUPER_ADMIN,
    Role.TENANT_ADMIN,
    Role.BRANCH_MANAGER,
    Role.BILLING_STAFF,
    Role.SALES_PERSON,
] as const;

export type TInternalRole = (typeof INTERNAL_ROLES)[number];

export const TECHENTIA_ROLES = [
    Role.TECHENTIA_SUPER_ADMIN,
    Role.TECHENTIA_ADMIN,
    Role.TECHENTIA_USER,
] as const;

export type TTechentiaRole = (typeof TECHENTIA_ROLES)[number];

export const EXTERNAL_ROLES = [Role.INFLUENCER, Role.CUSTOMER] as const;

export type TExternalRole = (typeof EXTERNAL_ROLES)[number];

export const isSystemRole = (value: unknown): value is TSystemRole =>
    typeof value === "string" &&
    (SYSTEM_ROLES as readonly string[]).includes(value);