// @/routes/product/product.route.ts
import { Router } from "express";
import { productController } from "../../controllers/index.js";
import { authenticate, requirePermission, validate, requireOrgScope, requireBranchScope } from "../../lib/middlewares/index.js";
import { productSchema } from "../../lib/schema/index.js";

export const productRouter = Router();

// All routes require authentication
productRouter.use(authenticate);

productRouter.get("/", productController.getProduct);

productRouter.get("/:id", validate({ params: productSchema.productIdSchema }), productController.getProductById);

productRouter.post("/", validate({ body: productSchema.createProductSchema }), productController.createProduct);

// productRouter.patch("/:id", authorize('product:update'), validate({ params: productSchema.productIdSchema, body: productSchema.updateProductSchema }), productController.updateProduct);

// productRouter.delete("/:id", authorize('product:delete'), validate({ params: productSchema.productIdSchema }), productController.deleteProduct);

// Create Product (Tenant admin)
// router.post("/orgs/:orgId/products", authenticate, requireOrgScope(), requirePermission(Permission["product:create"]), productController.create);

// // Cancel bill approval (Branch manager)
// router.post("/orgs/:orgId/branches/:branchId/bills/:billId/cancel/approve", authenticate, requireOrgScope(), requireBranchScope(), requirePermission(Permission["billing:cancel:approve"]), billingController.approveCancel);