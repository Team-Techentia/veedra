import { Router } from "express";
import { authenticate, requireOrgScope, requirePermission, validate } from "../../lib/middlewares/index.js";
import { Permission } from "../../lib/consts/permissions/permissions.consts.js";
import { tenantUserSchema } from "../../lib/schema/index.js";
import { tenantUsersController } from "../../controllers/index.js";

export const tenantUsersRouter = Router();

/**
 * Tenant super admin/admin can create tenant users
 */
tenantUsersRouter.post(
  "/orgs/:orgId/users/create",
  authenticate,
  requireOrgScope(),
  requirePermission(Permission["users:write"]),
  validate({
    params: tenantUserSchema.orgIdParamsSchema,
    body: tenantUserSchema.createTenantUserSchema,
  }),
  tenantUsersController.createTenantUser
);