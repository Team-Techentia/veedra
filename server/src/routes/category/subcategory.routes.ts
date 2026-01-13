import { Router } from "express";
import { authenticate, requirePermission, validate } from "../../lib/middlewares/index.js";
import { Permission } from "../../lib/consts/permissions/permissions.consts.js";
import { z } from "zod";
import { subCategoryController } from "../../controllers/category/category.controller.js";

export const subCategoryRouter = Router();

const createSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
});

subCategoryRouter.post(
  "/",
  authenticate,
  requirePermission(Permission["category:create"]),
  validate({ body: createSchema }),
  subCategoryController.create
);

subCategoryRouter.get(
  "/category/:categoryId",
  authenticate,
  requirePermission(Permission["category:read"]),
  subCategoryController.listByCategory
);
