import { Router } from "express";
import { authenticate, requirePermission } from "../../lib/middlewares/index.js";
import { Permission } from "../../lib/consts/permissions/permissions.consts.js";
import { platformUsersController } from "../../controllers/index.js";

export const platformUsersRouter = Router();

/**
 * Only TECHENTIA_SUPER_ADMIN can create Techentia users.
 * We enforce with platform:write + users:write
 */
platformUsersRouter.post(
    "/create",
    authenticate,
    requirePermission({ allOf: [Permission["platform:write"], Permission["users:write"]] }),
    platformUsersController.createTechentiaUser
);