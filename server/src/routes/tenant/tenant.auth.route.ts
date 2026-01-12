import { Router } from "express";
import { authenticate, requirePermission, validate } from "../../lib/middlewares/index.js";
import { Permission } from "../../lib/consts/permissions/permissions.consts.js";
import { tenantAuthSchema } from "../../lib/schema/index.js";
import { authController, tenantAuthController } from "../../controllers/index.js";

export const tenantAuthRouter = Router();

// ---- Auth
tenantAuthRouter.post("/login", validate({ body: tenantAuthSchema.loginSchema }), tenantAuthController.login);
tenantAuthRouter.post("/refresh", authController.refresh);
tenantAuthRouter.post("/logout", authController.logout);

// ---- Me (tenant staff only)
tenantAuthRouter.get(
    "/me",
    authenticate,
    requirePermission(Permission["org:read"]),
    authController.me
);

// Tenant portal guard
tenantAuthRouter.get(
    "/guard",
    authenticate,
    requirePermission(Permission["org:read"]),
    authController.guardTenant
);