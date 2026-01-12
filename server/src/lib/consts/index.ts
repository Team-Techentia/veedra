export { PERMISSIONS, Permission, ROLE_PERMISSIONS, ROLE_PERMISSION_SETS, getRolePermissionSet, getRolePermissions, isPermission, } from "./permissions/permissions.consts.js"
export { EXTERNAL_ROLES, INTERNAL_ROLES, Role, SYSTEM_ROLES, TECHENTIA_ROLES, isSystemRole, } from "./roles/roles.consts.js"

export type { TPermission, TRolePermissionMap, TRolePermissionSetMap, } from "./permissions/permissions.consts.js"
export type { TSystemRole, TExternalRole, TTechentiaRole, TInternalRole } from "./roles/roles.consts.js"