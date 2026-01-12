// import express from "express";
// import { authController } from "../../controllers/index.js";
// import { Permission } from "../../lib/consts/permissions/permissions.consts.js";
// import { authenticate, requirePermission, validate } from "../../lib/middlewares/index.js";

// const router = express.Router();

// // public
// router.post("/auth/login", validate({ body: /* zod schema optional */ undefined }), authController.login);
// router.post("/auth/register", validate({ body: undefined }), authController.registerCustomer);
// router.post("/auth/refresh", authController.refresh); // refresh reads refresh cookie

// // authenticated
// router.post("/auth/logout", authenticate, authController.logout);
// router.get("/auth/me", authenticate, authController.me);

// // provider management
// router.post("/auth/link-provider", authenticate, authController.linkProvider);
// router.post("/auth/unlink-provider", authenticate, authController.unlinkProvider);
// router.post("/auth/set-password", authenticate, authController.setPassword);

// // invite (tenant/techentia) - requires users:invite
// router.post("/auth/invite", authenticate, requirePermission(Permission["users:invite"]), authController.inviteUser);

// // impersonate (platform only)
// router.post("/auth/impersonate", authenticate, requirePermission(Permission["platform:impersonate"]), authController.impersonate);

// // refresh endpoint (for SPA)
// router.post("/auth/refresh", authController.refresh);

// export default router;