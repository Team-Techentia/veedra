import { Router } from "express";
import { authController } from "../../controllers/auth/auth.controller.js";
import { authenticate, requirePermission } from "../../lib/middlewares/index.js";
import { Permission } from "../../lib/consts/index.js";

export const externalAuthRouter = Router();

externalAuthRouter.post("/login", authController.login);
externalAuthRouter.post("/refresh", authController.refresh);
externalAuthRouter.post("/logout", authController.logout);

// Me
externalAuthRouter.get(
  "/me",
  authenticate,
  requirePermission({ anyOf: [Permission["wallet:read"], Permission["influencer:metrics:read"]] }),
  authController.me
);

// External portal guard
externalAuthRouter.get(
  "/guard",
  authenticate,
  requirePermission({ anyOf: [Permission["wallet:read"], Permission["influencer:metrics:read"]] }),
  authController.guardExternal
);
