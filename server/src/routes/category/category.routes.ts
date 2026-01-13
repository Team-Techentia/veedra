import { Router } from "express";
import { authenticate, requirePermission, validate } from "../../lib/middlewares/index.js";
import { Permission } from "../../lib/consts/permissions/permissions.consts.js";
import { categoryController } from "../../controllers/category/category.controller.js";
import { z } from "zod";

export const categoryRouter = Router();

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

categoryRouter.post(
  "/",
  authenticate,
  requirePermission(Permission["category:create"]),
  validate({ body: createSchema }),
  categoryController.create
);

categoryRouter.get(
  "/",
  authenticate,
  requirePermission(Permission["category:read"]),
  categoryController.list
);
