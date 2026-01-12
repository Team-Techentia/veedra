import { Router } from "express";
import { authenticate, requirePermission } from "../../lib/middlewares/index.js";
import { Permission } from "../../lib/consts/permissions/permissions.consts.js";
import { authController } from "../../controllers/auth/auth.controller.js";

export const platformAuthRouter = Router();

// ---- Auth
platformAuthRouter.post("/login", authController.login);
platformAuthRouter.post("/refresh", authController.refresh);
platformAuthRouter.post("/logout", authController.logout);

// ---- Me (only platform staff)
platformAuthRouter.get(
    "/me",
    authenticate,
    requirePermission({ anyOf: [Permission["platform:read"], Permission["platform:support:read"]] }),
    authController.me
);

// ---- Optional guard (for frontend portal auth)
platformAuthRouter.get(
    "/guard",
    authenticate,
    requirePermission(Permission["platform:read"]),
    authController.guardPlatform
);