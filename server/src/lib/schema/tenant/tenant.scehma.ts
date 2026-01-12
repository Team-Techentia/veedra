import { z } from "zod";
import { INTERNAL_ROLES } from "../../consts/index.js";

export const tenantUserSchema = {
  // ---------------- Create ----------------
  createTenantUserSchema: z.object({
    email: z.string().email("Invalid email").min(5).max(250).transform((v) => v.toLowerCase().trim()),
    name: z.string().min(2, "Name must be at least 2 characters").max(200, "Name cannot exceed 200 characters").trim(),

    roles: z.array(z.enum(INTERNAL_ROLES)).min(1, "At least one role is required"),

    branchScopes: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? [] : val),
        z.array(z.string().min(12, "Invalid branchId")).max(50, "branchScopes max 50")
      )
      .optional(),
  }),

  // ---------------- Params ----------------
  orgIdParamsSchema: z.object({
    orgId: z.string().min(12, "Invalid orgId"),
  }),
};

// ---------------- Type Exports ----------------
export type CreateTenantUserRequest = z.infer<typeof tenantUserSchema.createTenantUserSchema>;
export type OrgIdParamsRequest = z.infer<typeof tenantUserSchema.orgIdParamsSchema>;