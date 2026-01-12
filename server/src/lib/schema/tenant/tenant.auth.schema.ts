import { z } from "zod";
import { AUTH_PROVIDERS } from "../../types/auth/auth.types.js";

/**
 * Tenant Login can happen in 2 ways:
 * 1) LOCAL  -> email + password
 * 2) OTP    -> mobile/email + otp
 *
 * We keep it future-ready using discriminatedUnion.
 */

export const tenantAuthSchema = {
    // ---------------- LOGIN ----------------
    loginSchema: z.discriminatedUnion("provider", [
        // ✅ LOCAL login (email + password)
        z.object({
            provider: z.literal("LOCAL"),

            email: z.string().email("Invalid email").transform((v) => v.toLowerCase().trim()),
            password: z.string().min(6, "Password must be at least 6 characters").max(100),

            // org context
            orgId: z.string().min(4, "Invalid orgId").transform((v) => v.toLowerCase().trim()),
            branchId: z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string().min(12, "Invalid branchId").optional()),
        }),

        // ✅ OTP login (mobile/email + otp) (future)
        z.object({
            provider: z.literal("OTP"),

            mobile: z.preprocess(
                (v) => (v === "" || v === null || v === undefined ? undefined : String(v).trim()),
                z.string().min(10, "Invalid mobile").max(15).optional()
            ),

            email: z.preprocess(
                (v) => (v === "" || v === null || v === undefined ? undefined : String(v).toLowerCase().trim()),
                z.string().email("Invalid email").optional()
            ),

            otp: z.string().min(4, "OTP too short").max(10, "OTP too long"),

            // org context
            orgId: z.string().min(4, "Invalid orgId").transform((v) => v.toLowerCase().trim()),
            branchId: z.preprocess(
                (v) => (v === "" || v === null || v === undefined ? undefined : v),
                z.string().min(12, "Invalid branchId").optional()
            ),
        }),
    ]),

    // ---------------- REFRESH ----------------
    refreshSchema: z.object({
        // empty body; tokens come from cookies
    }),

    // ---------------- LOGOUT ----------------
    logoutSchema: z.object({
        // empty body
    }),
};

// ---------------- Type Exports ----------------
export type TenantLoginRequest = z.infer<typeof tenantAuthSchema.loginSchema>;