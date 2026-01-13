import { Router } from "express";
import { authenticate, requirePermission, validate } from "../../lib/middlewares/index.js";
import { Permission } from "../../lib/consts/permissions/permissions.consts.js";
import { productSchema } from "../../lib/schema/product/product.schema.js";
import { productController } from "../../controllers/product/product.controller.js";

export const productRouter = Router();

// Create product
productRouter.post(
  "/",
  authenticate,
  requirePermission(Permission["product:create"]),
  validate({ body: productSchema.create }),
  productController.create
);

// List products
productRouter.get(
  "/",
  authenticate,
  requirePermission(Permission["product:read"]),
//   validate({ query: productSchema.list }),
  productController.list
);

// Get by barcode
productRouter.get(
  "/barcode/:barcode",
  authenticate,
  requirePermission(Permission["product:read"]),
  productController.getByBarcode
);

// Soft delete by barcode
productRouter.delete(
  "/barcode/:barcode",
  authenticate,
  requirePermission(Permission["product:archive"]),
  productController.softDelete
);
