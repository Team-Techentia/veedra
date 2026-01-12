// @/routes/reports/reports.route.ts

import { Router } from "express";
import { authenticate } from "../../lib/middlewares/index.js";

export const reportRouter = Router();

reportRouter.use(authenticate);

// Branch reports (Manager sees only their branch, Admin sees all)
// reportRouter.get(
//   "/sales",
//   authorize('report:branch'),
//   enforceBranchScope(), // auto-scopes to manager's branch
//   reportController.getSalesReport
// );

// // System-wide reports (Admin only)
// reportRouter.get(
//   "/system/overview",
//   authorize('report:system'),
//   reportController.getSystemOverview
// );

// // Staff performance (Manager + Admin)
// reportRouter.get(
//   "/staff-performance",
//   authorize(['report:staff', 'report:branch'], false), // requires ANY
//   enforceBranchScope(),
//   reportController.getStaffPerformance
// );