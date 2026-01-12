import { NextFunction, Response, RequestHandler } from "express";
import { AppError, AuthRequest } from "../../types/index.js";
import { ROLE_PERMISSIONS, TPermission } from "../../consts/permissions/permissions.consts.js";
import { mergePermissions } from "../../utils/helpers/permission.helper.js";

// required can be single OR any-of list OR all-of list
type RequirePermissionInput = TPermission | { anyOf: readonly TPermission[] } | { allOf: readonly TPermission[] };

export const requirePermission = (required: RequirePermissionInput): RequestHandler => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            if (!user) throw new AppError("Authentication required", 401);

            // role-based perms
            const rolePerms: TPermission[] = [];
            for (const role of user.roles || []) {
                rolePerms.push(...ROLE_PERMISSIONS[role]);
            }

            const perms = mergePermissions({ rolePermissions: rolePerms, allow: user.allow, deny: user.deny, });

            const ok = (() => {
                if (typeof required === "string") return perms.has(required);

                if ("anyOf" in required) return required.anyOf.some((p) => perms.has(p));
                if ("allOf" in required) return required.allOf.every((p) => perms.has(p));

                return false;
            })();

            if (!ok) throw new AppError("Forbidden: insufficient permissions", 403);

            // attach resolved set if you want for later middlewares
            req.permissions = perms;
            next();
        } catch (err) {
            next(err);
        }
    };
};