import { TPermission } from "../../consts/permissions/permissions.consts";

export type MergePermissionsInput = Readonly<{
    rolePermissions: readonly TPermission[];
    allow?: readonly TPermission[];
    deny?: readonly TPermission[];
}>;

export function mergePermissions(input: MergePermissionsInput): ReadonlySet<TPermission> {
    const set = new Set<TPermission>();

    // role grants
    for (const p of input.rolePermissions) set.add(p);

    // allow overrides
    if (input.allow?.length) {
        for (const p of input.allow) set.add(p);
    }

    // denies win ALWAYS
    if (input.deny?.length) {
        for (const p of input.deny) set.delete(p);
    }

    return set;
}

export function hasPermission(perms: ReadonlySet<TPermission>, required: TPermission): boolean {
    return perms.has(required);
}

export function hasAnyPermission(perms: ReadonlySet<TPermission>, required: readonly TPermission[]): boolean {
    return required.some((p) => perms.has(p));
}

export function hasAllPermissions(perms: ReadonlySet<TPermission>, required: readonly TPermission[]): boolean {
    return required.every((p) => perms.has(p));
}