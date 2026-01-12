import { Router } from "express";
import { authenticate, } from "../../lib/middlewares/index.js";

// @/routes/billing/billing.route.ts
export const billingRouter = Router();

billingRouter.use(authenticate);

// Create bill (Staff + Manager + Admin)
// billingRouter.post(
//   "/",
//   authorize('bill:create'),
//   enforceBranchScope('branchId'), // must bill in own branch
//   validate({ body: billingSchema.createBillSchema }),
//   billingController.createBill
// );

// // Cancel bill (Manager + Admin only)
// billingRouter.post(
//   "/:billId/cancel",
//   authorize('bill:cancel'),
//   validate({
//     params: billingSchema.billIdSchema,
//     body: billingSchema.cancelReasonSchema
//   }),
//   billingController.cancelBill
// );

// // Process return (Manager + Admin only)
// billingRouter.post(
//   "/:billId/return",
//   authorize('bill:return'),
//   validate({
//     params: billingSchema.billIdSchema,
//     body: billingSchema.returnSchema
//   }),
//   billingController.processReturn
// );