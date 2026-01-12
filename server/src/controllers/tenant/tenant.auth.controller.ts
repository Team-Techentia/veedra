import { Request, Response } from "express";
import { AppError } from "../../lib/types/index.js";
import { helperUtils } from "../../lib/utils/index.js";
import { jwtUtils } from "../../lib/utils/token/token.utils.js";
import { Organization, User } from "../../models/index.js";
import { TenantLoginRequest } from "../../lib/schema/index.js";

export const tenantAuthController = {
    async login(req: Request, res: Response) {
        const data = req.body as TenantLoginRequest;

        const org = await Organization.findOne({ orgId: data.orgId, isActive: true, });

        if (!org) throw new AppError("Organization not found or inactive", 404);

        // ✅ now search user
        const email = data.email?.toLowerCase().trim();

        const user = await User.findOne({ email, isDeleted: false, });

        if (!user) throw new AppError("Invalid credentials", 401);
        if (user.status !== "ACTIVE") throw new AppError("User is not active", 403);

        // ✅ tenant boundary enforcement
        // (globalScope bypasses tenant boundary, but tenant login should normally not allow global users)
        if (user.globalScope) {
            throw new AppError("Platform accounts cannot login from tenant portal", 403);
        }

        // must match org
        if (String(user.orgId) !== String(org._id)) {
            throw new AppError("Forbidden: user not part of this organization", 403);
        }

        if (data.provider === "LOCAL") {
            // ensure LOCAL exists
            const hasLocal = user.auth.providers.some((p) => p.provider === "LOCAL");
            if (!hasLocal || !user.auth.passwordHash) throw new AppError("Password login not enabled", 403);

            const ok = await helperUtils.password.compare(data.password, user.auth.passwordHash);

            if (!ok) {
                await user.recordFailedLogin();
                throw new AppError("Invalid credentials", 401);
            }
        } else if (data.provider === "OTP") {
            // ✅ OTP login (future-ready)
            const hasOtp = user.auth.providers.some((p) => p.provider === "OTP");
            if (!hasOtp) throw new AppError("OTP login not enabled", 403);

            // 🔥 You MUST verify OTP via OTP service/store (redis/db)
            // Example (pseudo):
            // const valid = await otpService.verify({ userId: user._id, otp: data.otp });
            // if (!valid) throw new AppError("Invalid OTP", 401);

            // For now placeholder
            if (!data.otp) throw new AppError("OTP is required", 400);

            // ⚠️ Replace this with actual OTP validation
            const validOtp = data.otp === "0000";
            if (!validOtp) throw new AppError("Invalid OTP", 401);
        } else {
            // future safety
            throw new AppError("Unsupported auth provider", 400);
        }

        if (user.isLocked) throw new AppError("Account locked. Try later.", 403);

        // ✅ branch context (optional)
        const branchId = data.branchId;

        // ✅ session id
        const sessionId = helperUtils.id.nanoid();

        // ✅ IMPORTANT:
        // In token, store orgId as MONGO _ID for scope checks (requireOrgScope)
        const accessToken = jwtUtils.generateToken(
            {
                sub: String(user._id),
                userId: user.userId,

                // ✅ mongo _id context
                orgId: String(org._id),
                branchId,

                roles: user.roles,
                globalScope: false,

                allow: user.permissionOverrides.allow,
                deny: user.permissionOverrides.deny,

                sessionId,
            },
            "ACCESS"
        );

        const refreshToken = jwtUtils.generateToken(
            {
                sub: String(user._id),
                sessionId,
            },
            "REFRESH"
        );

        jwtUtils.setAuthCookies(res, { accessToken, refreshToken });

        await user.recordLogin("LOCAL");

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                org: {
                    _id: org._id,
                    orgId: org.orgId, // "veedra"
                    name: org.name,
                },
                user: {
                    _id: user._id,
                    userId: user.userId,
                    email: user.email,
                    name: user.name,
                    roles: user.roles,
                    globalScope: false,
                    orgId: String(org._id),
                    branchId,
                },
            },
        });
    },
};